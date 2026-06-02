import { NextRequest, NextResponse } from "next/server";
import { MODEL_OPTIONS, getActiveModelId } from "@/lib/x5";
import { writeSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Which providers actually have credentials in the environment. */
function availability(): Record<string, boolean> {
  const x5 = !!(
    (process.env.X5_COPILOT_API_KEY || "").trim() &&
    (process.env.X5_COPILOT_COMPLETIONS_URL || "").trim()
  );
  const polza = !!(process.env.POLZA_API_KEY || "").trim();
  const byProvider: Record<string, boolean> = { x5, polza };
  const map: Record<string, boolean> = {};
  for (const o of MODEL_OPTIONS) map[o.id] = byProvider[o.provider] ?? false;
  return map;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    active: getActiveModelId(),
    options: MODEL_OPTIONS,
    available: availability(),
  });
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Некорректный JSON" }, { status: 400 });
  }
  const id = body?.id;
  if (!MODEL_OPTIONS.some((o) => o.id === id)) {
    return NextResponse.json({ ok: false, error: "Неизвестная модель" }, { status: 400 });
  }
  writeSettings({ activeModel: id });
  return NextResponse.json({ ok: true, active: id, available: availability() });
}
