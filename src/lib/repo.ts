/**
 * Artifact repository — the domain boundary over persistence.
 *
 * Everything that needs to read/write artifacts goes through here. The backing
 * store (store.ts, JSON files) is an implementation detail and can be replaced
 * with SQLite/Postgres without changing callers. See docs/ARCHITECTURE.md.
 *
 * Server-only.
 */
import { readCollection, writeCollection, readSettings, writeSettings } from "./store";
import { PIPELINE, type StageStatus } from "./pipeline";
import type {
  Artifact,
  ArtifactSource,
  ArtifactStatus,
  ArtifactType,
  GoalsPayload,
  RunRatePayload,
  StrategyPayload,
  VisionPayload,
} from "./artifacts";
import {
  VISION,
  RUNRATE_SEED,
  HYPOTHESES,
  PERSONAS,
  PRODUCTS,
  type Hypothesis,
  type Persona,
  type Product,
} from "./mock";
import type { ParsedHypothesis, ParsedPersona } from "./parsers";

const COLLECTION = "artifacts";

/* ───────────────────── active product ───────────────────── */

/** Currently selected product id (defaults to the first in the list). */
export function getActiveProductId(): string {
  const chosen = readSettings<{ activeProductId?: string }>({}).activeProductId;
  if (chosen && PRODUCTS.some((p) => p.id === chosen)) return chosen;
  return PRODUCTS[0]?.id ?? "aipo";
}

export function setActiveProductId(id: string): void {
  if (!PRODUCTS.some((p) => p.id === id)) return;
  writeSettings({ activeProductId: id });
}

export function listProducts(): Product[] {
  return PRODUCTS;
}

function genId(type: ArtifactType): string {
  // Normal Node server context — Date/Math are available (unlike Workflow scripts).
  const rand = Math.floor(Math.random() * 1e6).toString(36);
  return `${type}_${Date.now().toString(36)}_${rand}`;
}

export function listArtifacts(type?: ArtifactType): Artifact[] {
  const all = readCollection<Artifact>(COLLECTION, []);
  return type ? all.filter((a) => a.type === type) : all;
}

export function getArtifact(id: string): Artifact | undefined {
  return readCollection<Artifact>(COLLECTION, []).find((a) => a.id === id);
}

/**
 * Create a new artifact (default status "draft") or update an existing one by id.
 * The artifact is bound to the active product unless productId is explicitly passed.
 */
export function saveArtifact(input: {
  id?: string;
  type: ArtifactType;
  payload: unknown;
  source?: ArtifactSource;
  status?: ArtifactStatus;
  createdBy?: string;
  productId?: string;
}): Artifact {
  const all = readCollection<Artifact>(COLLECTION, []);
  const now = new Date().toISOString();

  if (input.id) {
    const idx = all.findIndex((a) => a.id === input.id);
    if (idx >= 0) {
      all[idx] = {
        ...all[idx],
        payload: input.payload,
        status: input.status ?? all[idx].status,
        updatedAt: now,
      };
      writeCollection(COLLECTION, all);
      return all[idx];
    }
  }

  const artifact: Artifact = {
    id: genId(input.type),
    type: input.type,
    status: input.status ?? "draft",
    version: 0,
    payload: input.payload,
    source: input.source ?? "copilot",
    createdAt: now,
    updatedAt: now,
    createdBy: input.createdBy,
    productId: input.productId ?? getActiveProductId(),
  };
  all.push(artifact);
  writeCollection(COLLECTION, all);
  return artifact;
}

/**
 * Publish an artifact into its section. Marks it "published" and assigns the
 * next version among published artifacts of the same type (history is kept).
 */
export function publishArtifact(id: string, publishedBy?: string): Artifact | undefined {
  const all = readCollection<Artifact>(COLLECTION, []);
  const idx = all.findIndex((a) => a.id === id);
  if (idx < 0) return undefined;

  const target = all[idx];
  const maxVersion = all
    .filter((a) => a.type === target.type && a.status === "published")
    .reduce((max, a) => Math.max(max, a.version), 0);

  all[idx] = {
    ...target,
    status: "published",
    version: maxVersion + 1,
    updatedAt: new Date().toISOString(),
    createdBy: publishedBy ?? target.createdBy,
  };
  writeCollection(COLLECTION, all);
  return all[idx];
}

/**
 * Latest published artifact of a type for the active product.
 * Falls back to artifacts without productId (legacy seed-time artifacts).
 */
export function getLatestPublished<T = unknown>(type: ArtifactType): Artifact<T> | null {
  const pid = getActiveProductId();
  const published = listArtifacts(type).filter(
    (a) => a.status === "published" && (a.productId === pid || a.productId === undefined)
  );
  if (!published.length) return null;
  return published.sort((a, b) => b.version - a.version)[0] as Artifact<T>;
}

/* ───────────── Section accessors (published artifact ↦ section data) ─────────────
 * Each returns the latest published payload, falling back to the mock seed so
 * the UI is always populated before any copilot has published. */

export function getVision(): VisionPayload {
  const latest = getLatestPublished<VisionPayload>("vision");
  return latest ? latest.payload : (VISION as VisionPayload);
}

/** Latest published Strategy, with fallback to vision's strategyByYear, then mock. */
export function getStrategy(): StrategyPayload {
  const latest = getLatestPublished<StrategyPayload>("strategy");
  if (latest) return latest.payload;
  const v = getVision();
  return {
    stepsByYear: v.strategyByYear ?? [],
    focus: v.bets,
  };
}

/** Latest published Goals, with fallback to vision's goals, then mock. */
export function getGoals(): GoalsPayload {
  const latest = getLatestPublished<GoalsPayload>("goals");
  if (latest) return latest.payload;
  const v = getVision();
  return {
    target: v.goalsTarget ?? v.metricsTargets.map((m) => ({ name: m.name, value: m.target })),
    base: v.goalsBase ?? [],
  };
}

/** Latest published RunRate (plan values), falling back to the mock seed. */
export function getRunRate(): RunRatePayload {
  const latest = getLatestPublished<RunRatePayload>("runrate");
  return latest ? latest.payload : (RUNRATE_SEED as RunRatePayload);
}

/* ───────────────────── hypotheses + PO feedback ───────────────────── */

type HypoFeedback = {
  id: string;
  decision: "validated" | "rejected";
  comment?: string;
  at: string;
};

const HYPO_FEEDBACK = "hypothesis-feedback";
const HYPO_MANUAL = "hypotheses-manual";

/** Published hypotheses (from the copilot) → backlog proposals awaiting PO review. */
function publishedHypotheses(): Hypothesis[] {
  const pub = getLatestPublished<{ items: ParsedHypothesis[] }>("hypotheses");
  const items = pub?.payload?.items ?? [];
  return items.map((it, i) => ({
    id: `pub-${pub!.id}-${i}`,
    title: it.title,
    metric: it.metric || "—",
    status: "new" as const,
    ice: { impact: 5, confidence: 5, ease: 5 },
    source: "agent" as const,
    tag: "proposal" as const,
    basis: it.basis,
    verify: it.verify,
    data: it.data,
    sourceRef: it.sourceRef,
  }));
}

/** Hypotheses backlog: seed + published + manual, with PO decisions merged in. */
export function getHypotheses(): Hypothesis[] {
  const feedback = readCollection<HypoFeedback>(HYPO_FEEDBACK, []);
  const manual = readCollection<Hypothesis>(HYPO_MANUAL, []);
  const byId = new Map(feedback.map((f) => [f.id, f]));
  return [...HYPOTHESES, ...publishedHypotheses(), ...manual].map((h) => {
    const f = byId.get(h.id);
    if (!f) return h;
    return {
      ...h,
      tag: undefined, // decided — no longer a pending proposal
      decision: f.decision,
      rejectComment: f.decision === "rejected" ? f.comment : undefined,
      status: f.decision === "validated" ? ("in-test" as const) : ("rejected" as const),
    };
  });
}

/** Record a PO decision on a hypothesis (validate/reject + optional comment). */
export function setHypothesisDecision(
  id: string,
  decision: "validated" | "rejected",
  comment?: string
): void {
  const all = readCollection<HypoFeedback>(HYPO_FEEDBACK, []);
  const idx = all.findIndex((f) => f.id === id);
  const entry: HypoFeedback = { id, decision, comment, at: new Date().toISOString() };
  if (idx >= 0) all[idx] = entry;
  else all.push(entry);
  writeCollection(HYPO_FEEDBACK, all);
}

/** Add a hypothesis manually (PO-authored). */
export function addManualHypothesis(title: string, metric: string): Hypothesis {
  const all = readCollection<Hypothesis>(HYPO_MANUAL, []);
  const h: Hypothesis = {
    id: `man-${Date.now().toString(36)}`,
    title,
    metric: metric || "—",
    status: "new",
    ice: { impact: 5, confidence: 5, ease: 5 },
    source: "human",
  };
  all.push(h);
  writeCollection(HYPO_MANUAL, all);
  return h;
}

/* ───────────────────── personas + goal editing ───────────────────── */

type PersonaEdit = { id: string; jtbd: string };
const PERSONA_EDITS = "persona-edits";

/** Personas: published (from the copilot) if any, else seed; with PO goal edits applied. */
export function getPersonas(): Persona[] {
  const edits = readCollection<PersonaEdit>(PERSONA_EDITS, []);
  const byId = new Map(edits.map((e) => [e.id, e.jtbd]));

  const pub = getLatestPublished<{ items: ParsedPersona[] }>("personas");
  const items = pub?.payload?.items ?? [];
  const base: Persona[] = items.length
    ? items.map((it, i) => ({
        id: `pub-${i}`,
        name: it.name,
        role: it.role,
        jtbd: it.jtbd,
        pains: it.pains ?? [],
        share: 0,
      }))
    : PERSONAS;

  return base.map((p) => (byId.has(p.id) ? { ...p, jtbd: byId.get(p.id)! } : p));
}

/** Edit a persona's goal/JTBD (persisted). */
export function setPersonaGoal(id: string, jtbd: string): void {
  const all = readCollection<PersonaEdit>(PERSONA_EDITS, []);
  const idx = all.findIndex((e) => e.id === id);
  if (idx >= 0) all[idx].jtbd = jtbd;
  else all.push({ id, jtbd });
  writeCollection(PERSONA_EDITS, all);
}

/* ───────────────────── pipeline (hard gating) ───────────────────── */

/** Derived pipeline state for the active product: stage open only after prev validated. */
export function getPipelineState(): Record<string, StageStatus> {
  const pid = getActiveProductId();
  const all = readSettings<{ pipelines?: Record<string, Record<string, string>> }>({}).pipelines ?? {};
  const raw = all[pid] ?? {};
  const result: Record<string, StageStatus> = {};
  let prevValidated = true; // первый этап всегда доступен
  for (const st of PIPELINE) {
    if (!prevValidated) {
      result[st.id] = "locked";
      continue;
    }
    const saved = raw[st.id];
    result[st.id] = saved === "validated" ? "validated" : saved === "generated" ? "generated" : "open";
    prevValidated = result[st.id] === "validated";
  }
  return result;
}

export function setPipelineStage(
  stageId: string,
  action: "generated" | "validated" | "reset"
): Record<string, StageStatus> {
  const pid = getActiveProductId();
  const all = {
    ...(readSettings<{ pipelines?: Record<string, Record<string, string>> }>({}).pipelines ?? {}),
  };
  const raw = { ...(all[pid] ?? {}) };
  if (action === "validated") raw[stageId] = "validated";
  else if (action === "generated") raw[stageId] = "generated";
  else if (action === "reset") {
    const idx = PIPELINE.findIndex((s) => s.id === stageId);
    if (idx >= 0) for (let i = idx; i < PIPELINE.length; i++) delete raw[PIPELINE[i].id];
  }
  all[pid] = raw;
  writeSettings({ pipelines: all });
  return getPipelineState();
}
