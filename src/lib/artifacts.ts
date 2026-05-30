/**
 * Artifact model + lifecycle.
 *
 * Copilots in the "ИИ-менеджер" hub produce artifacts; the PO approves and
 * publishes them; profile sections render the latest published version.
 * See docs/ARCHITECTURE.md §2.2 / §4.
 */

export type ArtifactType =
  | "vision"
  | "metrics"
  | "runrate"
  | "hypotheses"
  | "personas";

export type ArtifactStatus = "draft" | "approved" | "published";

export type ArtifactSource = "copilot" | "manual" | "integration";

/** Where each artifact type is published (section route + human label). */
export const ARTIFACT_SECTION: Record<ArtifactType, { href: string; label: string }> = {
  vision: { href: "/vision", label: "Видение и стратегия" },
  metrics: { href: "/monitoring", label: "Мониторинг" },
  runrate: { href: "/monitoring", label: "Мониторинг" },
  hypotheses: { href: "/discovery", label: "Discovery" },
  personas: { href: "/discovery", label: "Discovery" },
};

export type Artifact<T = unknown> = {
  id: string;
  type: ArtifactType;
  status: ArtifactStatus;
  /** Monotonic per (type, published) — bumped on publish. */
  version: number;
  payload: T;
  source: ArtifactSource;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
};

/* ─────────────── Payload shapes (typed per artifact type) ─────────────── */

/**
 * Vision payload. The first three fields mirror the current mock VISION shape
 * (so existing UI keeps working); the optional blocks are filled by the Vision
 * Writer parser once the copilot is wired (formulation, persona value,
 * strategy by year with orientirs, goals target/base, context).
 */
export type VisionPayload = {
  current: string;
  bets: string[];
  metricsTargets: { name: string; target: string }[];
  personaValue?: string[];
  strategyByYear?: {
    year: string;
    title: string;
    orientir?: string;
    results: string[];
  }[];
  goalsTarget?: { name: string; value: string }[];
  goalsBase?: { name: string; value: string }[];
  context?: string;
};

/**
 * RunRate payload — the single grouped table from metric-generator v2.5.
 * `periods` is the shared header; each goal is a heading row with its metrics
 * underneath, values aligned to `periods` (string to allow "XX", "-30%", etc.).
 */
export type RunRatePayload = {
  product: string;
  date: string;
  periods: string[];
  goals: {
    goal: string;
    metrics: { name: string; values: string[] }[];
  }[];
};
