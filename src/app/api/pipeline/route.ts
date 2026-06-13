import { NextRequest, NextResponse } from "next/server";
import { getPipelineState, setPipelineStage } from "@/lib/repo";
import { PIPELINE } from "@/lib/pipeline";
import { getAgent } from "@/lib/agents";

export const dynamic = "force-dynamic";

function agentBrief(id?: string) {
  if (!id) return null;
  const a = getAgent(id);
  return a
    ? {
        id: a.id,
        name: a.name,
        tagline: a.tagline,
        status: a.status ?? null,
        suggestions: a.suggestions ?? [],
        greeting: a.greeting ?? null,
        requiresMaterials: a.requiresMaterials ?? false,
        publishesTo: a.publishesTo ?? null,
      }
    : null;
}

/** Enriched stage metadata for the client (agent names/statuses + current state). */
function enrichedStages() {
  return PIPELINE.map((s) => ({
    id: s.id,
    n: s.n,
    title: s.title,
    gen: agentBrief(s.genAgent),
    eval: agentBrief(s.evalAgent),
  }));
}

export async function GET() {
  return NextResponse.json({ ok: true, stages: enrichedStages(), state: getPipelineState() });
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Некорректный JSON" }, { status: 400 });
  }
  const { stage, action } = body ?? {};
  if (!PIPELINE.some((s) => s.id === stage)) {
    return NextResponse.json({ ok: false, error: "Неизвестный этап" }, { status: 400 });
  }
  if (!["generated", "validated", "reset"].includes(action)) {
    return NextResponse.json({ ok: false, error: "Неизвестное действие" }, { status: 400 });
  }
  const state = setPipelineStage(stage, action);
  return NextResponse.json({ ok: true, state });
}
