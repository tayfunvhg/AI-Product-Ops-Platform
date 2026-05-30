import { NextRequest, NextResponse } from "next/server";
import { getPersonas, setPersonaGoal } from "@/lib/repo";

export const dynamic = "force-dynamic";

/**
 * Personas + goal (JTBD) editing.
 *  GET  → personas (published or seed, with edits applied)
 *  POST { id, jtbd } → save an edited persona goal
 */
export async function GET() {
  return NextResponse.json({ ok: true, personas: getPersonas() });
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Некорректный JSON" }, { status: 400 });
  }
  const { id, jtbd } = body ?? {};
  if (!id || !String(jtbd ?? "").trim()) {
    return NextResponse.json({ ok: false, error: "Нужны id и непустая цель" }, { status: 400 });
  }
  setPersonaGoal(id, String(jtbd).trim());
  return NextResponse.json({ ok: true });
}
