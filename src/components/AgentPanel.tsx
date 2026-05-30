"use client";

import { useEffect, useRef, useState } from "react";
import Markdown from "./Markdown";
import { ARTIFACT_SECTION, type ArtifactType } from "@/lib/artifacts";

// `content` is what we send to the model; `display` (optional) is the shorter
// version shown in the chat bubble (so big attachments don't flood the UI).
type Msg = { role: "user" | "assistant"; content: string; display?: string };
// `content` is the extracted text (empty for images); `note` is a human hint.
type Attachment = { name: string; content: string; kind: string; note?: string };

// Supported uploads: presentations, PDFs, Markdown and images. Text is
// extracted server-side via /api/extract.
const ACCEPT = ".pdf,.pptx,.md,.markdown,image/*";
const MAX_FILES = 5;

function fileIcon(kind: string): string {
  switch (kind) {
    case "pdf":
      return "📕";
    case "pptx":
      return "📊";
    case "markdown":
      return "📝";
    case "image":
      return "🖼️";
    default:
      return "📄";
  }
}

export default function AgentPanel({
  agentId,
  name,
  tagline,
  suggestions = [],
  compact = false,
  featured = false,
  greeting,
  requiresMaterials = false,
  publishesTo,
}: {
  agentId: string;
  name: string;
  tagline: string;
  suggestions?: string[];
  compact?: boolean;
  featured?: boolean;
  greeting?: string;
  /** Lock suggestion chips until the user attaches at least one file. */
  requiresMaterials?: boolean;
  /** If set, show "Опубликовать в раздел" — publishes the latest reply as an artifact. */
  publishesTo?: ArtifactType;
}) {
  const [open, setOpen] = useState(!compact);
  const [messages, setMessages] = useState<Msg[]>(
    greeting ? [{ role: "assistant", content: greeting }] : []
  );
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<{ href: string; label: string; version: number } | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Persist the conversation so it survives navigating away (page unmount) and
  // tab reloads — without this, leaving for "Настройки" and coming back wiped
  // the whole chat because messages lived only in component state.
  const storageKey = `agent-chat:${agentId}`;
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as Msg[];
        if (Array.isArray(parsed) && parsed.length) setMessages(parsed);
      }
    } catch {
      /* ignore corrupt/unavailable storage */
    }
    hydrated.current = true;
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated.current) return; // don't overwrite saved chat before restoring
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      /* storage full or unavailable — non-fatal */
    }
  }, [messages, storageKey]);

  function clearConversation() {
    setMessages(greeting ? [{ role: "assistant", content: greeting }] : []);
    setAttachments([]);
    setInput("");
    setUploadError(null);
    setPublished(null);
    setPublishError(null);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  }

  // Suggestion chips run an analysis on the user's materials, so they stay
  // locked until something is attached. Free-text chat is always allowed.
  const chipsLocked = requiresMaterials && attachments.length === 0;

  const hasConversation = messages.some((m) => m.role === "user");

  // Publishing target (set only for copilots that produce an artifact).
  const dest = publishesTo ? ARTIFACT_SECTION[publishesTo] : null;
  const canPublish = !!publishesTo && hasConversation;

  /** Publish the latest assistant reply as an artifact into its section. */
  async function publish() {
    if (!publishesTo) return;
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (!last) return;
    setPublishing(true);
    setPublishError(null);
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: publishesTo, text: last.content }),
      });
      const data = await res.json();
      if (!data?.ok) {
        setPublishError(data?.error ?? "Не удалось опубликовать");
      } else {
        setPublished({
          href: data.section.href,
          label: data.section.label,
          version: data.artifact?.version ?? 1,
        });
      }
    } catch {
      setPublishError("Ошибка сети при публикации");
    } finally {
      setPublishing(false);
    }
  }

  /** Download the visible conversation as a Markdown transcript. */
  function exportMarkdown() {
    const now = new Date();
    const header = [
      `# Переписка с агентом «${name}»`,
      "",
      `*${tagline}*`,
      "",
      `Экспортировано: ${now.toLocaleString("ru-RU")}`,
      "",
      "---",
      "",
    ];
    const body = messages.map((m) => {
      const who = m.role === "user" ? "Вы" : name;
      // Use the bubble text (what the user actually saw on screen).
      const text = (m.display ?? m.content).trim();
      return `**${who}:**\n\n${text}\n`;
    });
    const md = header.concat(body).join("\n");

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const stamp = now.toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const a = document.createElement("a");
    a.href = url;
    a.download = `perepiska-${agentId}-${stamp}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const room = MAX_FILES - attachments.length;
    if (room <= 0) {
      setUploadError(`Можно прикрепить не более ${MAX_FILES} файлов.`);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    const picked = Array.from(files).slice(0, room);
    setExtracting(true);
    setUploadError(null);

    const results = await Promise.all(
      picked.map(async (f) => {
        const fd = new FormData();
        fd.append("file", f);
        try {
          const res = await fetch("/api/extract", { method: "POST", body: fd });
          const data = await res.json();
          if (!data?.ok) return { error: data?.error ?? `Не удалось обработать ${f.name}` };
          return {
            name: data.name as string,
            content: (data.text as string) ?? "",
            kind: (data.kind as string) ?? "",
            note: data.note as string | undefined,
          } satisfies Attachment;
        } catch {
          return { error: `Ошибка сети при загрузке ${f.name}` };
        }
      })
    );

    const ok = results.filter((r): r is Attachment => !("error" in r));
    const errs = results.flatMap((r) => ("error" in r ? [r.error] : []));
    if (ok.length) setAttachments((a) => [...a, ...ok].slice(0, MAX_FILES));
    if (errs.length) setUploadError(errs.join(" • "));

    setExtracting(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function send(text: string) {
    const typed = text.trim();
    if ((!typed && attachments.length === 0) || loading) return;

    const filesNote = attachments.length
      ? `\n\n📎 Вложено: ${attachments.map((a) => a.name).join(", ")}`
      : "";
    const materialsBlock = attachments.length
      ? "\n\nМАТЕРИАЛЫ ОТ ПОЛЬЗОВАТЕЛЯ:\n" +
        attachments
          .map((a) => {
            const body = a.content.trim() || a.note || "(текст не извлечён)";
            return `--- ${a.name} ---\n${body}`;
          })
          .join("\n\n")
      : "";

    const apiContent = (typed || "Вот материалы, проанализируй их.") + materialsBlock;
    const display = (typed || "(материалы во вложении)") + filesNote;

    const next: Msg[] = [...messages, { role: "user", content: apiContent, display }];
    setMessages(next);
    setInput("");
    setAttachments([]);
    setLoading(true);
    setPublished(null); // output is changing — require a fresh publish
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply: string = data?.reply ?? data?.error ?? "Пустой ответ.";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Ошибка сети при обращении к агенту." },
      ]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      });
    }
  }

  return (
    <div className="card-green flex flex-col">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-start justify-between gap-3 text-left"
      >
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-500/90 text-ink-900">
            🤖
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">{name}</span>
              <span className="chip border-brand-300/30 bg-brand-300/10 text-brand-100">
                AI-агент
              </span>
            </div>
            <p className="mt-0.5 text-sm text-white/55">{tagline}</p>
          </div>
        </div>
        <span className="mt-1 text-white/40">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="mt-4 flex flex-col gap-3">
          {hasConversation && (
            <div className="flex items-center justify-between gap-4">
              <div>
                {canPublish && (
                  <button
                    type="button"
                    onClick={publish}
                    disabled={publishing}
                    title={`Опубликовать последний ответ в раздел «${dest?.label}»`}
                    className="text-xs font-medium text-brand-200 hover:text-brand-100 disabled:opacity-50"
                  >
                    {publishing ? "Публикую…" : `⤴︎ Опубликовать в «${dest?.label}»`}
                  </button>
                )}
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={exportMarkdown}
                  title="Скачать переписку в формате Markdown"
                  className="text-xs text-white/45 hover:text-white"
                >
                  ⬇︎ Скачать переписку (.md)
                </button>
                <button
                  type="button"
                  onClick={clearConversation}
                  title="Очистить переписку с этим агентом"
                  className="text-xs text-white/45 hover:text-rose-300"
                >
                  🗑 Очистить
                </button>
              </div>
            </div>
          )}

          {published && (
            <div className="rounded-xl border border-brand-300/30 bg-brand-300/10 px-3 py-2 text-xs text-brand-100">
              ✅ Опубликовано в раздел{" "}
              <a href={published.href} className="font-semibold underline hover:text-white">
                {published.label}
              </a>{" "}
              (версия {published.version}). Решение остаётся за вами — артефакт можно
              перегенерировать и опубликовать заново.
            </div>
          )}

          {publishError && (
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">
              {publishError}
            </div>
          )}
          <div
            ref={scrollRef}
            className={`${featured ? "max-h-[28rem]" : "max-h-72"} space-y-3 overflow-y-auto pr-1`}
          >
            {messages.length === 0 && (
              <div className="rounded-xl border border-white/5 bg-ink-800/60 p-3 text-sm text-white/55">
                Задайте вопрос агенту, выберите подсказку или прикрепите материалы
                (📎 PDF, PPTX, Markdown, изображения). Агент предлагает артефакты —
                решение всегда за вами.
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    m.role === "user"
                      ? "whitespace-pre-wrap bg-brand-500 text-ink-900"
                      : "border border-white/5 bg-ink-800/80 text-white/85"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <Markdown>{m.content}</Markdown>
                  ) : (
                    m.display ?? m.content
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-white/5 bg-ink-800/80 px-3.5 py-2.5 text-sm text-white/50">
                  Агент думает…
                </div>
              </div>
            )}
          </div>

          {!messages.some((m) => m.role === "user") && suggestions.length > 0 && (
            <div className="flex flex-col gap-2">
              {chipsLocked && (
                <p className="text-xs text-white/45">
                  Приложите материалы (📎), чтобы использовать подсказки. Или просто
                  напишите сообщение.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    disabled={chipsLocked}
                    title={chipsLocked ? "Сначала приложите материалы (📎)" : undefined}
                    className="chip enabled:hover:border-brand-300/40 enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {extracting && (
            <div className="text-xs text-white/45">Обрабатываю файлы…</div>
          )}

          {uploadError && (
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">
              {uploadError}
            </div>
          )}

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((a, i) => (
                <span
                  key={i}
                  title={a.note}
                  className="chip border-brand-300/30 bg-brand-300/10 text-brand-100"
                >
                  {fileIcon(a.kind)} {a.name}
                  {a.note && <span className="ml-1 text-amber-300/80">ⓘ</span>}
                  <button
                    onClick={() => setAttachments((arr) => arr.filter((_, j) => j !== i))}
                    className="ml-1 text-white/60 hover:text-white"
                    aria-label="Убрать"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              multiple
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={extracting}
              title="Прикрепить материалы (PDF, PPTX, Markdown, изображения)"
              className="btn-ghost px-3 disabled:opacity-50"
            >
              📎
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Спросите агента…"
              className="flex-1 rounded-xl border border-white/10 bg-ink-800/80 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-brand-300/40"
            />
            <button
              type="submit"
              disabled={loading || extracting}
              className="btn-primary disabled:opacity-50"
            >
              Отправить
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
