import { NextResponse } from "next/server";
import { getHypotheses } from "@/lib/repo";
import { trackerSync } from "@/lib/integrations";

export const dynamic = "force-dynamic";

/**
 * Sync hypotheses with the Tracker board (stub).
 * New items would be pushed to the board; existing ones reconciled.
 */
export async function POST() {
  const hyp = getHypotheses();
  const newCount = hyp.filter((h) => h.status === "new" && !h.tag).length;
  const existing = hyp.filter((h) => h.status !== "new").length;
  return NextResponse.json(trackerSync(newCount, existing));
}
