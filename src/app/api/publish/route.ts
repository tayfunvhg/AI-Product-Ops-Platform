import { NextRequest, NextResponse } from "next/server";
import { saveArtifact, publishArtifact } from "@/lib/repo";
import { parseArtifact } from "@/lib/parsers";
import { ARTIFACT_SECTION, type ArtifactType } from "@/lib/artifacts";

export const dynamic = "force-dynamic";

const KNOWN: ArtifactType[] = ["vision", "metrics", "runrate", "hypotheses", "personas"];

/**
 * Publish a copilot's output into its section.
 *
 * POST { type, text, publishedBy? }
 *   → parse text into a typed payload
 *   → save as draft, then publish (creates a new published version)
 *   → return the artifact + the section route to navigate to.
 *
 * This backs the AgentPanel "Опубликовать в раздел" button.
 */
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Некорректный JSON" }, { status: 400 });
  }

  const type = body?.type as ArtifactType;
  const text = typeof body?.text === "string" ? body.text : "";

  if (!KNOWN.includes(type)) {
    return NextResponse.json({ ok: false, error: "Неизвестный тип артефакта" }, { status: 400 });
  }
  if (!text.trim()) {
    return NextResponse.json({ ok: false, error: "Пустой текст для публикации" }, { status: 400 });
  }

  const payload = parseArtifact(type, text);
  const draft = saveArtifact({ type, payload, source: "copilot" });
  const artifact = publishArtifact(draft.id, body?.publishedBy ?? "PO");

  return NextResponse.json({
    ok: true,
    artifact,
    section: ARTIFACT_SECTION[type],
  });
}
