import { NextRequest, NextResponse } from "next/server";
import { confluenceExport } from "@/lib/integrations";
import { getVision } from "@/lib/repo";

export const dynamic = "force-dynamic";

/**
 * Export the current vision to Confluence (stub).
 * POST {} → uses the latest published vision to build a page title.
 */
export async function POST(_req: NextRequest) {
  const vision = getVision();
  const title = `Видение продукта — ${vision.current.slice(0, 60)}`;
  const result = confluenceExport(title);
  return NextResponse.json(result);
}
