/**
 * Server-side file → text extraction for agent attachments.
 *
 * Supported kinds (others are rejected by the API route):
 *   - markdown (.md / .markdown) — decoded as UTF-8 text
 *   - pdf (.pdf)                 — text layer extracted via pdf-parse
 *   - pptx (.pptx)              — slide text extracted from the OOXML zip
 *   - image (png/jpg/…)         — no text; the text-only model can't read
 *                                  pixels, so we attach a short note instead
 *
 * Heavy parsers live here (server-only) so they never reach the browser bundle.
 */
import JSZip from "jszip";
import { PDFParse } from "pdf-parse";

export type ExtractKind = "markdown" | "pdf" | "pptx" | "image";

export type ExtractResult = {
  name: string;
  kind: ExtractKind;
  /** Text to feed the model. Empty for images. */
  text: string;
  chars: number;
  /** Human-facing note (e.g. image not readable, scanned PDF, truncation). */
  note?: string;
};

/** Per-file cap on extracted text — keeps payloads/tokens sane for a prototype. */
const MAX_CHARS = 20000;

const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "heic"];

/**
 * Classify a file by name/MIME. Returns null for unsupported types so the
 * caller can reject them with a clear message.
 */
export function kindFor(name: string, mime: string): ExtractKind | null {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  const m = (mime || "").toLowerCase();

  if (ext === "md" || ext === "markdown" || m === "text/markdown") return "markdown";
  if (ext === "pdf" || m === "application/pdf") return "pdf";
  if (ext === "pptx" || m.includes("presentationml")) return "pptx";
  if (IMAGE_EXTS.includes(ext) || m.startsWith("image/")) return "image";
  return null;
}

export async function extractFile(
  buf: Buffer,
  name: string,
  kind: ExtractKind
): Promise<ExtractResult> {
  let text = "";
  let note: string | undefined;

  if (kind === "markdown") {
    text = buf.toString("utf8").trim();
  } else if (kind === "pdf") {
    text = await extractPdf(buf);
    if (!text) {
      note =
        "В PDF не найден текстовый слой (возможно, это скан/изображение). " +
        "Текстовая модель его не прочитает — опишите содержимое текстом.";
    }
  } else if (kind === "pptx") {
    text = await extractPptx(buf);
    if (!text) note = "В презентации не найден извлекаемый текст.";
  } else {
    // image — no text content for a text-only model
    note =
      "Изображение приложено. Текущая модель текстовая и не анализирует пиксели; " +
      "если на нём важен текст — продублируйте его в сообщении.";
  }

  let truncated = false;
  if (text.length > MAX_CHARS) {
    text = text.slice(0, MAX_CHARS);
    truncated = true;
  }
  if (truncated) {
    note = [note, `Текст обрезан до ${MAX_CHARS} символов.`].filter(Boolean).join(" ");
  }

  return { name, kind, text, chars: text.length, note };
}

async function extractPdf(buf: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  try {
    const result = await parser.getText();
    return cleanWhitespace(typeof result?.text === "string" ? result.text : "");
  } finally {
    await parser.destroy();
  }
}

async function extractPptx(buf: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buf);
  const slideNames = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => slideNumber(a) - slideNumber(b));

  const parts: string[] = [];
  for (let i = 0; i < slideNames.length; i++) {
    const xml = await zip.files[slideNames[i]].async("string");
    const slideText = textFromSlideXml(xml);
    if (slideText) parts.push(`[Слайд ${i + 1}]\n${slideText}`);
  }
  return parts.join("\n\n");
}

/** Pull text runs (<a:t>…</a:t>) out of a slide's OOXML. */
function textFromSlideXml(xml: string): string {
  const runs = [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((m) => decodeXmlEntities(m[1]));
  return cleanWhitespace(runs.join(" "));
}

function slideNumber(path: string): number {
  const m = path.match(/slide(\d+)\.xml$/);
  return m ? parseInt(m[1], 10) : 0;
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, "&");
}

function cleanWhitespace(s: string): string {
  return s
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
