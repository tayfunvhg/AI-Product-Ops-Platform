import { NextRequest, NextResponse } from "next/server";
import { getAgent } from "@/lib/agents";
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
  const HEAD = 3; // greeting + first user message (materials/goals) + first reply
  const TAIL = 13;
  const userMessages =
    convo.length <= HEAD + TAIL
      ? convo
      : [...convo.slice(0, HEAD), ...convo.slice(convo.length - TAIL)];

  if (!getX5Config()) {
    return NextResponse.json({
      ok: true,
      configured: false,
      reply: `🔌 Агент «${agent.name}» готов к работе, но X5 Copilot пока не подключён в этом окружении.\n\nЧтобы оживить агента: заполните ключ в .env.local и перезапустите. В разделе «Настройки» есть кнопка «Проверить подключение».`,
    });
  }

  const messages: ChatMessage[] = [
    { role: "system", content: agent.systemPrompt },
    ...userMessages,
  ];

  const res = await x5ChatCompletion(messages, { temperature: 0.3, timeoutMs: 25000 });

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
