import { NextResponse } from "next/server";
import { getAgent } from "@/lib/agents";
import { x5ChatCompletion, getX5Config, type ChatMessage } from "@/lib/x5";
import { parseHypotheses } from "@/lib/parsers";
import { saveArtifact, publishArtifact } from "@/lib/repo";
import { buildContext } from "@/lib/context";

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

  // ── Сквозной контекст собирается в одной переиспользуемой точке ──
  const ctx = buildContext();

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
      "- Обоснованность: подтверждено исследованием | частично подтверждено | гипотеза PO | предложение\n" +
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
