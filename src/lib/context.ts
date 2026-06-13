/**
 * Сборка сквозного контекста продукта для агентов — ЕДИНАЯ точка.
 *
 * Новые агенты, которым нужен кросс-разделовый контекст (видение, метрики,
 * RunRate, персоны, исследования, брифы, бэклог, существующие гипотезы),
 * должны звать buildContext(), а не собирать его заново у себя в роуте.
 *
 * Server-only.
 *
 * TODO: источник контекста = RAG — сейчас контекст собирается из репозитория
 * артефактов + демо-данных (mock); в целевой версии этот сборщик заменяется на
 * RAG-выборку по запросу агента, интерфейс функции при этом сохраняется.
 */
import { getVision, getPersonas, getRunRate, getHypotheses } from "./repo";
import { METRICS, BACKLOG, BRIEFS, RESEARCH } from "./mock";

/**
 * Возвращает текстовый блок «весь доступный контекст по продукту из всех
 * разделов платформы», готовый для вставки в промт агента.
 */
export function buildContext(): string {
  const vision = getVision();
  const personas = getPersonas();
  const runrate = getRunRate();
  const existing = getHypotheses();

  // Раздел «Видение и стратегия» — целиком.
  const visionBlock = [
    `Формулировка: ${vision.current}`,
    vision.bets?.length ? `Стратегические ставки: ${vision.bets.join("; ")}` : "",
    vision.strategyByYear?.length
      ? `Стратегия по годам: ${vision.strategyByYear
          .map((s) => `${s.year} — ${s.title}${s.orientir ? ` [${s.orientir}]` : ""}: ${s.results.join(", ")}`)
          .join(" | ")}`
      : "",
    vision.goalsTarget?.length
      ? `Целевые цели: ${vision.goalsTarget.map((g) => `${g.name}=${g.value}`).join("; ")}`
      : vision.metricsTargets?.length
      ? `Цели: ${vision.metricsTargets.map((m) => `${m.name}=${m.target}`).join("; ")}`
      : "",
    vision.goalsBase?.length
      ? `База (сейчас): ${vision.goalsBase.map((g) => `${g.name}=${g.value}`).join("; ")}`
      : "",
    vision.context ? `Контекст/риски: ${vision.context}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  // Раздел «Метрики» — факт + плановый RunRate.
  const runrateBlock = runrate.goals
    .map(
      (g) =>
        `  ${g.goal}: ${g.metrics
          .map((m) => `${m.name} → ${m.values.join("/")} (${runrate.periods.join("/")})`)
          .join("; ")}`
    )
    .join("\n");

  return [
    `РАЗДЕЛ «ВИДЕНИЕ И СТРАТЕГИЯ»:\n${visionBlock}`,
    `РАЗДЕЛ «МЕТРИКИ» — текущие значения:\n${METRICS.map(
      (m) => `- ${m.name}: ${m.value} (${m.delta}, тренд ${m.trend}, ${m.kind})`
    ).join("\n")}`,
    `RunRate (план по периодам):\n${runrateBlock}`,
    `ПЕРСОНЫ:\n${personas
      .map((p) => `- ${p.name} (${p.role}): цель «${p.jtbd}»; боли: ${p.pains.join("; ")}`)
      .join("\n")}`,
    `РЕЗУЛЬТАТЫ ИССЛЕДОВАНИЙ:\n${RESEARCH.map((r) => `- ${r.title}: ${r.summary}`).join("\n")}`,
    `БРИФЫ ОТ ЗАКАЗЧИКОВ:\n${BRIEFS.map((b) => `- ${b.title} (${b.from}, ${b.status})`).join("\n")}`,
    `БЭКЛОГ ИНИЦИАТИВ:\n${BACKLOG.map((b) => `- [${b.status}] ${b.title} — эффект ${b.impact} (${b.okr})`).join("\n")}`,
    `УЖЕ ЕСТЬ ГИПОТЕЗЫ (не повторяй их):\n${existing
      .map((h) => `- ${h.title} [${h.status}]`)
      .join("\n")}`,
  ].join("\n\n");
}
