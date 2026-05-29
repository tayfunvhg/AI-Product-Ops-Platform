import { NextRequest, NextResponse } from "next/server";
import { getAgent } from "@/lib/agents";
import { getX5Config, x5ChatCompletion, type ChatMessage } from "@/lib/x5";

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

  const history = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
  const userMessages = history.filter((m) => m.role === "user" || m.role === "assistant");

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

  if (!res.ok) {
    return NextResponse.json({
      ok: true,
      configured: true,
      reply: `⚠️ Не удалось получить ответ от X5 Copilot: ${res.error ?? "ошибка"}.\n\nЕсли вы вне сети X5/VPN, эндпоинт api-copilot.x5.ru может не резолвиться. Проверьте подключение в «Настройках».`,
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
