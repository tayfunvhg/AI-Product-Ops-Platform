import { NextResponse } from "next/server";
import { getAgent } from "@/lib/agents";
import { x5ChatCompletion, getX5Config, type ChatMessage } from "@/lib/x5";
import { parseHypotheses } from "@/lib/parsers";
import {
  saveArtifact,
  publishArtifact,
  getVision,
  getPersonas,
  getRunRate,
  getHypotheses,
} from "@/lib/repo";
import { METRICS, BACKLOG, BRIEFS, RESEARCH } from "@/lib/mock";

export const dynamic = "force-dynamic";

/**
 * Proactive hypothesis generation ("предлагаю сам").
 *
 * Gathers all available product context (vision, metrics, personas, backlog,
 * briefs), asks the LLM for hypotheses in the parseable format, then publishes
 * them as a "hypotheses" artifact — they appear in the Discovery backlog as
 * [Предложение] for the PO to validate/reject. No chat round-trip.
 */
export async function POST() {
  const agent = getAgent("hypothesis-agent");
  if (!agent) {
    return NextResponse.json({ ok: false, error: "Агент гипотез не найден" }, { status: 404 });
  }
  if (!getX5Config()) {
    return NextResponse.json({
      ok: false,
      error: "LLM не подключён (нужен X5/VPN). Проверьте .env.local и подключение.",
    });
  }

  // ── Assemble a COMPREHENSIVE context from every section ──
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

  const ctx = [
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

  const today = new Date().toISOString().slice(0, 10);
  const system: ChatMessage = {
    role: "system",
    content: `${agent.systemPrompt}\n\n---\nСегодняшняя дата: ${today}.`,
  };

  // Force the parseable output format regardless of the prompt's defaults.
  const user: ChatMessage = {
    role: "user",
    content:
      "Ниже — ВЕСЬ доступный контекст по продукту из всех разделов платформы: видение и " +
      "стратегия, метрики и RunRate, персоны, результаты исследований, брифы, бэклог и уже " +
      "существующие гипотезы. Сделай КОМПЛЕКСНЫЙ анализ — свяжи сигналы из разных разделов " +
      "(например, боль из исследований + проседающая метрика + цель из видения). Работай в " +
      "режиме «предлагаю сам»: НЕ задавай вопросов, сразу предложи 5–7 НОВЫХ гипотез (не " +
      "повторяй уже существующие). Используй ТОЛЬКО числа из контекста; где данных нет — [DATA REQUIRED]. " +
      "Каждую гипотезу выводи СТРОГО в формате (без таблиц):\n\n" +
      "Гипотеза N: Если мы [действие], то [метрика] [изменится/вырастет/снизится], потому что [обоснование].\n" +
      "- Источник: [откуда]\n" +
      "- Уверенность: высокая | средняя | низкая\n" +
      "- Проверка: [A/B | CustDev | анализ данных | опрос | прототип]\n" +
      "- Данные: [достаточно | DATA REQUIRED — что нужно]\n\n" +
      "=== КОНТЕКСТ ===\n" +
      ctx,
  };

  const res = await x5ChatCompletion([system, user], { temperature: 0.4, timeoutMs: 90000 });
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: res.error ?? "Ошибка LLM" });
  }

  const parsed = parseHypotheses(res.text);
  if (!parsed.items.length) {
    return NextResponse.json({
      ok: false,
      error: "Модель ответила, но гипотезы не распознаны. Попробуйте ещё раз.",
    });
  }

  const draft = saveArtifact({ type: "hypotheses", payload: parsed, source: "copilot" });
  publishArtifact(draft.id, "Генератор гипотез");

  return NextResponse.json({ ok: true, count: parsed.items.length });
}
