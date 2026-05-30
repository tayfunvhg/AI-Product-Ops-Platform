import { NextRequest, NextResponse } from "next/server";
import { getHypotheses, setHypothesisDecision, addManualHypothesis } from "@/lib/repo";

export const dynamic = "force-dynamic";

/**
 * Hypotheses backlog + PO decisions.
 *
 *  GET  → backlog with decisions applied
 *  POST { id, decision: "validated"|"rejected", comment? }
 *        → record the decision (feedback the agent learns from)
 */
export async function GET() {
  return NextResponse.json({ ok: true, hypotheses: getHypotheses() });
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Некорректный JSON" }, { status: 400 });
  }

  if (body?.action === "add") {
    const title = String(body?.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ ok: false, error: "Нужна формулировка гипотезы" }, { status: 400 });
    }
    const h = addManualHypothesis(title, String(body?.metric ?? "").trim());
    return NextResponse.json({ ok: true, hypothesis: h });
  }

  const { id, decision, comment } = body ?? {};
  if (!id || (decision !== "validated" && decision !== "rejected")) {
    return NextResponse.json({ ok: false, error: "Нужны id и decision" }, { status: 400 });
  }
  if (decision === "rejected" && !String(comment ?? "").trim()) {
    return NextResponse.json(
      { ok: false, error: "Для отклонения нужен комментарий (фидбэк агенту)" },
      { status: 400 }
    );
  }

  setHypothesisDecision(id, decision, comment);
  return NextResponse.json({ ok: true });
}
