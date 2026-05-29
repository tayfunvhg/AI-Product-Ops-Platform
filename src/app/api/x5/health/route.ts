import { NextResponse } from "next/server";
import { getX5Config, x5ChatCompletion } from "@/lib/x5";

export const dynamic = "force-dynamic";

/**
 * Connection test for X5 Copilot. Used by the Settings screen
 * ("Проверить подключение"). Sends a tiny request and reports status.
 */
export async function GET() {
  const cfg = getX5Config();
  if (!cfg) {
    return NextResponse.json({
      ok: false,
      configured: false,
      message:
        "Ключ не сконфигурирован. Заполните X5_COPILOT_API_KEY и X5_COPILOT_COMPLETIONS_URL в .env.local и перезапустите сервер.",
    });
  }

  const res = await x5ChatCompletion(
    [
      { role: "system", content: "Return STRICT JSON only." },
      { role: "user", content: 'Reply with {"ok":true} only.' },
    ],
    { temperature: 0, timeoutMs: 15000 }
  );

  return NextResponse.json({
    ok: res.ok,
    configured: true,
    model: cfg.model,
    authMode: cfg.authMode,
    endpoint: cfg.url,
    latencyMs: res.latencyMs,
    status: res.status,
    sample: res.ok ? res.text.slice(0, 200) : undefined,
    message: res.ok
      ? "Подключение к X5 Copilot успешно."
      : `Не удалось подключиться: ${res.error ?? "неизвестная ошибка"}`,
  });
}
