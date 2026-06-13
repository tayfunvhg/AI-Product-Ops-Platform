/**
 * Parsers: copilot text output → typed artifact payload.
 *
 * Copilots return Markdown in formats fixed by their prompts. These parsers
 * extract structure for the section UIs. They are best-effort and always keep
 * the raw text, so publishing never loses fidelity even if a model drifts from
 * the format. See docs/ARCHITECTURE.md §2.3.
 *
 * The RunRate parser relies on the v2.5 "машинный инвариант": a single grouped
 * table where a goal is a row with all period cells empty and a metric is a row
 * whose first cell starts with "— " and whose period cells are filled.
 */
import type {
  ArtifactType,
  GoalsPayload,
  RunRatePayload,
  StrategyPayload,
  VisionPayload,
} from "./artifacts";

/* ───────────────────────────── helpers ───────────────────────────── */

const stripMd = (s: string) =>
  s
    .replace(/\*\*/g, "")
    .replace(/^[>#\s]+/, "")
    .replace(/^[-•▸*]\s+/, "")
    .trim();

function sectionBetween(text: string, startRe: RegExp, endRes: RegExp[]): string {
  const start = text.search(startRe);
  if (start < 0) return "";
  const rest = text.slice(start).replace(startRe, "");
  let end = rest.length;
  for (const re of endRes) {
    const i = rest.search(re);
    if (i >= 0 && i < end) end = i;
  }
  return rest.slice(0, end).trim();
}

function bullets(block: string): string[] {
  return block
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^[-•▸*]\s+/.test(l))
    .map((l) => stripMd(l))
    .filter(Boolean);
}

/* ───────────────────────────── vision ───────────────────────────── */

export function parseVision(text: string): VisionPayload & { raw: string } {
  const headings = [
    /Блок\s*2/i,
    /Блок\s*3/i,
    /Контекст/i,
    /Представьте/i,
  ];

  // Formulation: a blockquote or the first substantial paragraph under Блок 1.
  const block1 = sectionBetween(text, /Блок\s*1[^\n]*\n/i, [/Представьте/i, /Блок\s*2/i]);
  const quote = block1.match(/(?:^|\n)\s*>?\s*[«"]([^»"]{20,})[»"]/);
  let current =
    (quote && stripMd(quote[1])) ||
    block1
      .split("\n")
      .map((l) => stripMd(l))
      .find((l) => l.length > 20) ||
    "";

  // Persona value bullets after "Представьте, что ... будет:"
  const personaBlock = sectionBetween(text, /Представьте[^\n]*\n/i, [/Блок\s*2/i, /Блок\s*3/i]);
  const personaValue = bullets(personaBlock);

  // Strategy by year (Блок 2): bold year lines + sub-bullets.
  const strategyBlock = sectionBetween(text, /Блок\s*2[^\n]*\n/i, [/Блок\s*3/i, /Контекст/i]);
  const strategyByYear: NonNullable<VisionPayload["strategyByYear"]> = [];
  let cur: NonNullable<VisionPayload["strategyByYear"]>[number] | null = null;
  for (const line of strategyBlock.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    // year heading: starts with bold OR matches "20xx — Title"
    const head = t.match(/^[-*\s]*\*?\*?\s*(\d{4}(?:\s*[-–]\s*\d{4})?)\s*[—-]\s*([^*\n]+?)\*?\*?\s*(?:\*?\[?\s*Ориентир[:\s]*([^\]*]+)\]?\*?)?$/i);
    if (head) {
      if (cur) strategyByYear.push(cur);
      cur = { year: head[1].trim(), title: stripMd(head[2]), orientir: head[3]?.trim(), results: [] };
    } else if (/^\s{2,}[-•*]/.test(line) || /^[-•▸*]/.test(t)) {
      if (cur) cur.results.push(stripMd(t));
    }
  }
  if (cur) strategyByYear.push(cur);

  // Bets for the current UI: prefer strategy titles, else top-level bullets.
  const bets = strategyByYear.length
    ? strategyByYear.map((s) => `${s.year} — ${s.title}`)
    : bullets(strategyBlock).slice(0, 5);

  // Goals (Блок 3): target year + base.
  const goalsBlock = sectionBetween(text, /Блок\s*3[^\n]*\n/i, [/Контекст/i]);
  const parseGoals = (re: RegExp) => {
    const b = sectionBetween(goalsBlock, re, [/Текущий год/i, /Целевой год/i, /база/i]);
    return bullets(b)
      .map((l) => {
        const m = l.split(/\s[—-]\s/);
        return m.length >= 2 ? { name: m[0].trim(), value: m.slice(1).join(" — ").trim() } : null;
      })
      .filter((x): x is { name: string; value: string } => !!x);
  };
  const goalsTarget = parseGoals(/Целевой год[^\n]*\n/i);
  const goalsBase = parseGoals(/(Текущий год|база)[^\n]*\n/i);

  const metricsTargets = goalsTarget.map((g) => ({ name: g.name, target: g.value }));

  const context = sectionBetween(text, /Контекст[^\n]*\n/i, []) || undefined;

  return {
    current: current || "(формулировка не распознана — см. полный текст)",
    bets,
    metricsTargets,
    personaValue: personaValue.length ? personaValue : undefined,
    strategyByYear: strategyByYear.length ? strategyByYear : undefined,
    goalsTarget: goalsTarget.length ? goalsTarget : undefined,
    goalsBase: goalsBase.length ? goalsBase : undefined,
    context,
    raw: text,
  };
}

/* ───────────────────────────── runrate ───────────────────────────── */

export function parseRunRate(text: string): RunRatePayload & { raw: string } {
  const product =
    text.match(/RUNRATE:?\s*([^\n|]+)/i)?.[1]?.trim() ||
    text.match(/МЕТРИКИ ПРОДУКТА:?\s*([^\n|]+)/i)?.[1]?.trim() ||
    "Продукт";
  const date = text.match(/Дата:?\s*([0-9.\-]{6,10})/i)?.[1]?.trim() || "";

  // Collect markdown table rows.
  const rows = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("|") && l.endsWith("|"));

  const cells = (row: string) =>
    row
      .slice(1, -1)
      .split("|")
      .map((c) => c.trim());

  // header = first table row; skip the separator row (---).
  const tableRows = rows.filter((r) => !/^\|[\s:|-]+\|$/.test(r));
  const periods: string[] = tableRows.length ? cells(tableRows[0]).slice(1) : [];

  const goals: RunRatePayload["goals"] = [];
  let curGoal: RunRatePayload["goals"][number] | null = null;

  for (const row of tableRows.slice(1)) {
    const c = cells(row);
    const first = c[0];
    const values = c.slice(1);
    const periodFilled = values.some((v) => v && v !== "");
    const isMetric = /^[-—–]\s+/.test(first);

    if (isMetric || (periodFilled && curGoal)) {
      const name = stripMd(first.replace(/^[-—–]\s+/, ""));
      (curGoal ?? (curGoal = { goal: "(без цели)", metrics: [] })).metrics.push({
        name,
        values,
      });
    } else {
      // goal heading row (bold, empty period cells)
      if (curGoal) goals.push(curGoal);
      curGoal = { goal: stripMd(first), metrics: [] };
    }
  }
  if (curGoal) goals.push(curGoal);

  return { product, date, periods, goals, raw: text };
}

/* ───────────────────────────── strategy ───────────────────────────── */

export function parseStrategy(text: string): StrategyPayload {
  // Reuse the vision parser: it already extracts strategyByYear from the same
  // "Year — Title [Ориентир: ...]" pattern used in strategy outputs.
  const v = parseVision(text);
  const diagnosis =
    sectionBetween(text, /Диагноз[^\n]*\n/i, [/Фокус/i, /Шаги/i, /Блок\s*2/i]) || undefined;
  const focus = bullets(
    sectionBetween(text, /Фокус[^\n]*\n/i, [/Шаги/i, /Диагноз/i, /Блок\s*2/i])
  );
  return {
    diagnosis,
    focus: focus.length ? focus : undefined,
    stepsByYear: v.strategyByYear ?? [],
    raw: text,
  };
}

/* ───────────────────────────── goals ──────────────────────────────── */

export function parseGoals(text: string): GoalsPayload {
  const v = parseVision(text);
  return {
    target: v.goalsTarget ?? v.metricsTargets.map((m) => ({ name: m.name, value: m.target })),
    base: v.goalsBase ?? [],
    raw: text,
  };
}

/* ──────────────────────────── hypotheses ──────────────────────────── */

export type ParsedHypothesis = {
  title: string;
  metric: string;
  /** Текстовая шкала обоснованности (стандарт маркировки §5, System 2). */
  basis?: "validated" | "partial" | "hypothesis" | "proposal";
  verify?: string;
  data?: string;
  sourceRef?: string;
};

export function parseHypotheses(text: string): { items: ParsedHypothesis[]; raw: string } {
  const items: ParsedHypothesis[] = [];
  let cur: ParsedHypothesis | null = null;
  const push = () => {
    if (cur && cur.title) items.push(cur);
    cur = null;
  };

  for (const raw of text.split("\n")) {
    const l = stripMd(raw.trim());
    if (!l) continue;

    if (/^Гипотеза\s*\d*\s*[:.]/i.test(l) || /^Если мы\b/i.test(l)) {
      push();
      const title = l.replace(/^Гипотеза\s*\d*\s*[:.]\s*/i, "");
      const metric =
        title.match(/,?\s*то\s+(.+?)\s+(?:изменит|вырас|снизит|увеличит|сократ|упад|повыс)/i)?.[1] ?? "";
      cur = { title, metric: metric.trim() };
      continue;
    }
    if (!cur) continue;

    const m = l.match(/^(Источник|Обоснованность|Проверка|Данные|Метрика)\s*[:—-]\s*(.+)$/i);
    if (m) {
      const k = m[1].toLowerCase();
      const v = m[2].trim();
      if (k.startsWith("источник")) cur.sourceRef = v;
      else if (k.startsWith("обоснованность"))
        cur.basis = /подтвержд.*исслед/i.test(v)
          ? "validated"
          : /частично/i.test(v)
          ? "partial"
          : /предложен/i.test(v)
          ? "proposal"
          : "hypothesis";
      else if (k.startsWith("проверка")) cur.verify = v;
      else if (k.startsWith("данные")) cur.data = v;
      else if (k.startsWith("метрика") && !cur.metric) cur.metric = v;
    }
  }
  push();
  return { items, raw: text };
}

/* ──────────────────────────── personas ──────────────────────────── */

export type ParsedPersona = { name: string; role: string; jtbd: string; pains: string[] };

export function parsePersonas(text: string): { items: ParsedPersona[]; raw: string } {
  const blocks = text.split(/\n(?=#{1,3}\s|Персона[:\s])/i);
  const items: ParsedPersona[] = [];
  for (const b of blocks) {
    const nameM = b.match(/(?:Персона[:\s]*|#{1,3}\s*)(.+)/);
    if (!nameM) continue;
    const name = stripMd(nameM[1]);
    if (!name || name.length > 60) continue;
    const role = b.match(/Роль[:\s]*([^\n]+)/i)?.[1];
    const jtbd = b.match(/(?:JTBD|Задача|Цель)[:\s]*([^\n]+)/i)?.[1];
    items.push({
      name,
      role: role ? stripMd(role) : "",
      jtbd: jtbd ? stripMd(jtbd) : "",
      pains: bullets(b).slice(0, 4),
    });
  }
  return { items, raw: text };
}

/* ───────────────────────── generic dispatch ───────────────────────── */

export function parseArtifact(type: ArtifactType, text: string): unknown {
  switch (type) {
    case "vision":
      return parseVision(text);
    case "strategy":
      return parseStrategy(text);
    case "goals":
      return parseGoals(text);
    case "runrate":
    case "metrics":
      return parseRunRate(text);
    case "hypotheses":
      return parseHypotheses(text);
    case "personas":
      return parsePersonas(text);
    default:
      return { raw: text };
  }
}
