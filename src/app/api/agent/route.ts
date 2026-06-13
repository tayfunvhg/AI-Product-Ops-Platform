import { NextRequest, NextResponse } from "next/server";
import { getAgent, PROTECTION_BLOCK } from "@/lib/agents";
import { getX5Config, x5ChatCompletion, type ChatMessage } from "@/lib/x5";
import { logAgentTurn } from "@/lib/agentlog";

export const dynamic = "force-dynamic";

/**
 * Generic agent endpoint. The UI sends { agentId, messages }.
 * We prepend the agent's system prompt and call X5 Copilot.
 *
 * Prototype note: agents only return text proposals — they never mutate
 * platform state. If X5 is not configured/reachable, we return a clear,
 * non-blocking message so the UI stays usable.
 */
export async function POST(req: NextRequest) {
  let body: { agentId?: string; messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Некорректный JSON" }, { status: 400 });
  }

  const agent = getAgent(body.agentId ?? "");
  if (!agent) {
    return NextResponse.json({ ok: false, error: "Неизвестный агент" }, { status: 404 });
  }

  // Keep the conversation within a sane size, but NEVER drop the opening
  // turns — that first user message carries the attached materials and goals.
  // A naive slice(-N) would truncate them out on long chats, which is why the
  // agent "forgot the context" and fell back to the prompt's example goals.
  const convo = (Array.isArray(body.messages) ? body.messages : []).filter(
    (m) => m.role === "user" || m.role === "assistant"
  );
  // Keep the WHOLE conversation for normal sessions. The metric dialog is
  // stateful — metrics fixed mid-way must stay visible, or the final table
  // drifts/hallucinates. X5 models give 131k context, so this is affordable.
  // Only very long chats get trimmed, always preserving the opening turns
  // (materials/goals) plus the recent tail.
  const MAX_TURNS = 80;
  const HEAD = 4;
  const userMessages =
    convo.length <= MAX_TURNS
      ? convo
      : [...convo.slice(0, HEAD), ...convo.slice(convo.length - (MAX_TURNS - HEAD))];

  if (!getX5Config()) {
    return NextResponse.json({
      ok: true,
      configured: false,
      reply: `🔌 Агент «${agent.name}» готов к работе, но X5 Copilot пока не подключён в этом окружении.\n\nЧтобы оживить агента: заполните ключ в .env.local и перезапустите. В разделе «Настройки» есть кнопка «Проверить подключение».`,
    });
  }

  // Give the model the real current date. Without it, the agent invented dates
  // (e.g. "24.05.2024") and started RunRate from a past year. The prompt says
  // "use the date from context" — so we must actually put it in context.
  const today = new Date().toISOString().slice(0, 10);
  // Инжектим стандартный блок защиты в одной точке — но не дублируем его в
  // файловых промтах, которые уже несут свой раздел «Защита промта».
  const hasProtection = /Защита промта/i.test(agent.systemPrompt);
  const systemContent =
    `${agent.systemPrompt}` +
    (hasProtection ? "" : `\n\n${PROTECTION_BLOCK}`) +
    `\n\n---\nСегодняшняя дата: ${today}. ` +
    `Используй её как «текущую» для дат в таблицах и как стартовый год RunRate. ` +
    `Год, явно названный пользователем, — приоритетнее.`;

  const messages: ChatMessage[] = [
    { role: "system", content: systemContent },
    ...userMessages,
  ];

  // X5 models can take 10-18s on big RunRate turns (full history + long prompt);
  // 25s was too tight and caused aborts that surfaced as misleading 405s.
  const res = await x5ChatCompletion(messages, { temperature: 0.3, timeoutMs: 90000 });

  logAgentTurn({
    agentId: agent.id,
    model: res.model,
    ok: res.ok,
    latencyMs: res.latencyMs,
    status: res.status,
    error: res.error,
    turns: userMessages, // conversation turns sent (system prompt omitted)
    reply: res.ok ? res.text : "",
  });

  if (!res.ok) {
    return NextResponse.json({
      ok: true,
      configured: true,
      reply: `⚠️ Не удалось получить ответ от LLM: ${res.error ?? "ошибка"}.\n\nПроверьте подключение в разделе «Настройки». Для X5 нужен доступ к сети X5/VPN; как альтернатива для теста — провайдер DeepSeek (LLM_PROVIDER=deepseek).`,
    });
  }

  return NextResponse.json({
    ok: true,
    configured: true,
    reply: res.text || "(пустой ответ модели)",
    latencyMs: res.latencyMs,
    model: res.model,
  });
}
