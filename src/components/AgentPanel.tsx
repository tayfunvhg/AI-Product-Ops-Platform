"use client";

import { useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function AgentPanel({
  agentId,
  name,
  tagline,
  suggestions = [],
  compact = false,
}: {
  agentId: string;
  name: string;
  tagline: string;
  suggestions?: string[];
  compact?: boolean;
}) {
  const [open, setOpen] = useState(!compact);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, messages: next }),
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
            className="max-h-72 space-y-3 overflow-y-auto pr-1"
          >
            {messages.length === 0 && (
              <div className="rounded-xl border border-white/5 bg-ink-800/60 p-3 text-sm text-white/55">
                Задайте вопрос агенту или выберите подсказку. Агент предлагает
                артефакты — решение всегда за вами.
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
                  {m.content}
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

          {messages.length === 0 && suggestions.length > 0 && (
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

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2"
          >
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
