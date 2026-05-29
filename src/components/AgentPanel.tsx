"use client";

import { useRef, useState } from "react";

// `content` is what we send to the model; `display` (optional) is the shorter
// version shown in the chat bubble (so big attachments don't flood the UI).
type Msg = { role: "user" | "assistant"; content: string; display?: string };
type Attachment = { name: string; content: string };

const ACCEPT = ".txt,.md,.markdown,.json,.csv,.tsv,.yml,.yaml,.log";
const MAX_FILES = 5;
const MAX_CHARS = 20000; // per file, keeps payloads sane for a prototype

export default function AgentPanel({
  agentId,
  name,
  tagline,
  suggestions = [],
  compact = false,
  featured = false,
  greeting,
}: {
  agentId: string;
  name: string;
  tagline: string;
  suggestions?: string[];
  compact?: boolean;
  featured?: boolean;
  greeting?: string;
}) {
  const [open, setOpen] = useState(!compact);
  const [messages, setMessages] = useState<Msg[]>(
    greeting ? [{ role: "assistant", content: greeting }] : []
  );
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const picked = Array.from(files).slice(0, MAX_FILES);
    const read = await Promise.all(
      picked.map(async (f) => {
        try {
          const text = await f.text();
          return { name: f.name, content: text.slice(0, MAX_CHARS) };
        } catch {
          return { name: f.name, content: "" };
        }
      })
    );
    setAttachments((a) => [...a, ...read.filter((r) => r.content)].slice(0, MAX_FILES));
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
        attachments.map((a) => `--- ${a.name} ---\n${a.content}`).join("\n\n")
      : "";

    const apiContent = (typed || "Вот материалы, проанализируй их.") + materialsBlock;
    const display = (typed || "(материалы во вложении)") + filesNote;

    const next: Msg[] = [...messages, { role: "user", content: apiContent, display }];
    setMessages(next);
    setInput("");
    setAttachments([]);
    setLoading(true);
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
          <div
            ref={scrollRef}
            className={`${featured ? "max-h-[28rem]" : "max-h-72"} space-y-3 overflow-y-auto pr-1`}
          >
            {messages.length === 0 && (
              <div className="rounded-xl border border-white/5 bg-ink-800/60 p-3 text-sm text-white/55">
                Задайте вопрос агенту, выберите подсказку или прикрепите материалы
                (📎). Агент предлагает артефакты — решение всегда за вами.
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm ${
                    m.role === "user"
                      ? "bg-brand-500 text-ink-900"
                      : "border border-white/5 bg-ink-800/80 text-white/85"
                  }`}
                >
                  {m.display ?? m.content}
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
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="chip hover:border-brand-300/40 hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((a, i) => (
                <span key={i} className="chip border-brand-300/30 bg-brand-300/10 text-brand-100">
                  📄 {a.name}
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
              title="Прикрепить материалы (txt, md, csv, json…)"
              className="btn-ghost px-3"
            >
              📎
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Спросите агента…"
              className="flex-1 rounded-xl border border-white/10 bg-ink-800/80 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-brand-300/40"
            />
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              Отправить
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
