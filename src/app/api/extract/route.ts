import { NextRequest, NextResponse } from "next/server";
import { extractFile, kindFor } from "@/lib/extract";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // needs Buffer + pdf/zip parsers, not the edge runtime

/** Upper bound on a single upload — generous for decks/PDFs, still a guardrail. */
const MAX_BYTES = 15 * 1024 * 1024;

/**
 * Extract text from one uploaded file (multipart/form-data, field "file").
 * Returns { ok, name, kind, text, chars, note } so the client can attach the
 * extracted text to the next agent message. Binary parsing stays server-side.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json(
      { ok: false, error: "Ожидался multipart/form-data с полем file" },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Файл не передан" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: `Файл «${file.name}» слишком большой (макс. 15 МБ)` },
      { status: 413 }
    );
  }

  const kind = kindFor(file.name, file.type);
  if (!kind) {
    return NextResponse.json(
      {
        ok: false,
        error: `Тип не поддерживается: ${file.name}. Разрешены PDF, PPTX, Markdown и изображения.`,
      },
      { status: 415 }
    );
  }

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const result = await extractFile(buf, file.name, kind);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, error: `Не удалось обработать «${file.name}»: ${msg}` },
      { status: 422 }
    );
  }
}
