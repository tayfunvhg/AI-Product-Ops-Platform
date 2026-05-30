import { NextRequest, NextResponse } from "next/server";
import {
  listArtifacts,
  getArtifact,
  getLatestPublished,
  saveArtifact,
  publishArtifact,
} from "@/lib/repo";
import type { ArtifactType } from "@/lib/artifacts";

export const dynamic = "force-dynamic";

/**
 * Artifact API — CRUD + publish for the copilot → section flow.
 *
 *  GET  /api/artifacts?type=vision        → list artifacts of a type
 *  GET  /api/artifacts?latest=vision      → latest published of a type
 *  GET  /api/artifacts?id=...             → one artifact
 *  POST { action: "save", type, payload, id?, source?, status? }
 *  POST { action: "publish", id, publishedBy? }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const latest = searchParams.get("latest") as ArtifactType | null;
  const type = searchParams.get("type") as ArtifactType | null;

  if (id) return NextResponse.json({ ok: true, artifact: getArtifact(id) ?? null });
  if (latest) return NextResponse.json({ ok: true, artifact: getLatestPublished(latest) });
  return NextResponse.json({ ok: true, artifacts: listArtifacts(type ?? undefined) });
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Некорректный JSON" }, { status: 400 });
  }

  const action = body?.action;

  if (action === "publish") {
    if (!body?.id) {
      return NextResponse.json({ ok: false, error: "id обязателен" }, { status: 400 });
    }
    const artifact = publishArtifact(body.id, body.publishedBy);
    if (!artifact) {
      return NextResponse.json({ ok: false, error: "Артефакт не найден" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, artifact });
  }

  if (action === "save") {
    if (!body?.type) {
      return NextResponse.json({ ok: false, error: "type обязателен" }, { status: 400 });
    }
    const artifact = saveArtifact({
      id: body.id,
      type: body.type,
      payload: body.payload,
      source: body.source,
      status: body.status,
      createdBy: body.createdBy,
    });
    return NextResponse.json({ ok: true, artifact });
  }

  return NextResponse.json({ ok: false, error: "Неизвестное действие" }, { status: 400 });
}
