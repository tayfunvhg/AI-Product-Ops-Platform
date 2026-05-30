"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Hypothesis } from "@/lib/mock";

const STATUS_LABEL: Record<string, string> = {
  new: "Новая",
  "in-test": "В тесте",
  validated: "Подтверждена",
  rejected: "Отклонена",
};
const STATUS_COLOR: Record<string, string> = {
  new: "text-white/60",
  "in-test": "text-amber-300",
  validated: "text-brand-300",
  rejected: "text-rose-400",
};
const CERTAINTY_LABEL: Record<string, string> = {
  high: "уверенность высокая",
  medium: "уверенность средняя",
  low: "уверенность низкая",
};

function ice(h: Hypothesis) {
  return h.ice.impact * h.ice.confidence * h.ice.ease;
}

export default function HypothesisBacklog({ hypotheses }: { hypotheses: Hypothesis[] }) {
  const router = useRouter();
  const proposals = hypotheses.filter((h) => h.tag === "proposal");
  const backlog = [...hypotheses.filter((h) => h.tag !== "proposal")].sort(
    (a, b) => ice(b) - ice(a)
  );

  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [sync, setSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newMetric, setNewMetric] = useState("");
  const [adding, setAdding] = useState(false);

  async function addManual() {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/hypotheses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", title: newTitle, metric: newMetric }),
      });
      const d = await res.json();
      if (d?.ok) {
        setNewTitle("");
        setNewMetric("");
        setAddOpen(false);
        router.refresh();
      }
    } finally {
      setAdding(false);
    }
  }

  async function decide(id: string, decision: "validated" | "rejected", text?: string) {
    setBusy(id);
    try {
      const res = await fetch("/api/hypotheses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, decision, comment: text }),
      });
      const data = await res.json();
      if (data?.ok) {
        setRejecting(null);
        setComment("");
        router.refresh(); // re-render server data with the decision applied
      }
    } finally {
      setBusy(null);
    }
  }

  async function syncTracker() {
    setSyncing(true);
    setSync(null);
    try {
      const res = await fetch("/api/integrations/tracker", { method: "POST" });
      const d = await res.json();
      setSync(
        d?.ok
          ? `Отправлено новых: ${d.pushed}, сверено существующих: ${d.matched}. ${d.note}`
          : "Не удалось синхронизировать"
      );
    } catch {
      setSync("Ошибка сети при синхронизации");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Воронка предложений агента */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="section-title">Предложения агента</span>
          <span className="chip border-amber-400/30 bg-amber-400/10 text-amber-200">
            {proposals.length}
          </span>
        </div>
        {proposals.length === 0 ? (
          <p className="text-sm text-white/40">Новых предложений нет.</p>
        ) : (
          <div className="space-y-3">
            {proposals.map((h) => (
              <div key={h.id} className="card border-amber-400/20">
                <div className="flex items-center gap-2">
                  <span className="chip border-brand-300/30 bg-brand-300/10 text-brand-100">
                    🤖 предложение
                  </span>
                  {h.certainty && (
                    <span className="text-xs text-white/45">{CERTAINTY_LABEL[h.certainty]}</span>
                  )}
                </div>
                <div className="mt-2 text-sm text-white/85">{h.title}</div>
                <div className="mt-1 text-xs text-white/45">
                  метрика: {h.metric}
                  {h.verify ? ` · проверка: ${h.verify}` : ""}
                  {h.data ? ` · данные: ${h.data}` : ""}
                </div>
                {h.sourceRef && (
                  <div className="mt-0.5 text-xs text-white/35">источник: {h.sourceRef}</div>
                )}

                {rejecting === h.id ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Почему отклоняете? Комментарий — фидбэк для агента."
                      className="w-full rounded-xl border border-white/10 bg-ink-800/80 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-brand-300/40"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => decide(h.id, "rejected", comment)}
                        disabled={!comment.trim() || busy === h.id}
                        className="btn-primary bg-rose-500 text-white disabled:opacity-50"
                      >
                        Отклонить
                      </button>
                      <button
                        onClick={() => {
                          setRejecting(null);
                          setComment("");
                        }}
                        className="btn-ghost"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => decide(h.id, "validated")}
                      disabled={busy === h.id}
                      className="btn-primary disabled:opacity-50"
                    >
                      ✓ Валидировать
                    </button>
                    <button
                      onClick={() => setRejecting(h.id)}
                      disabled={busy === h.id}
                      className="btn-ghost"
                    >
                      ✕ Отклонить
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Бэклог гипотез */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="section-title">Бэклог гипотез</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setAddOpen((o) => !o)} className="text-xs text-brand-200 hover:text-brand-100">
              + вручную
            </button>
            <Link href="/manager" className="text-xs text-brand-200 hover:text-brand-100">
              + через агента
            </Link>
          </div>
        </div>

        {addOpen && (
          <div className="mb-3 card space-y-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Гипотеза: Если мы…, то…, потому что…"
              className="w-full rounded-xl border border-white/10 bg-ink-800/80 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-brand-300/40"
            />
            <input
              value={newMetric}
              onChange={(e) => setNewMetric(e.target.value)}
              placeholder="Метрика (необязательно)"
              className="w-full rounded-xl border border-white/10 bg-ink-800/80 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-brand-300/40"
            />
            <div className="flex gap-2">
              <button onClick={addManual} disabled={adding || !newTitle.trim()} className="btn-primary disabled:opacity-50">
                Добавить
              </button>
              <button onClick={() => setAddOpen(false)} className="btn-ghost">
                Отмена
              </button>
            </div>
          </div>
        )}

        <div className="card divide-y divide-white/5 p-0">
          {backlog.map((h) => (
            <div key={h.id} className="flex items-start justify-between gap-3 p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${STATUS_COLOR[h.status]}`}>
                    {STATUS_LABEL[h.status]}
                  </span>
                  {h.source === "agent" && (
                    <span className="chip border-brand-300/30 bg-brand-300/10 text-brand-100">
                      🤖
                    </span>
                  )}
                </div>
                <div className="mt-1 text-sm font-medium text-white">{h.title}</div>
                <div className="mt-0.5 text-xs text-white/45">метрика: {h.metric}</div>
                {h.rejectComment && (
                  <div className="mt-1 text-xs text-rose-300/80">
                    отклонено: {h.rejectComment}
                  </div>
                )}
              </div>
              <div className="shrink-0 text-right">
                <div className="text-xs text-white/40">ICE</div>
                <div className="text-lg font-bold text-brand-300">{ice(h)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Синхронизация с Трекером */}
      <div className="space-y-2">
        <button onClick={syncTracker} disabled={syncing} className="btn-ghost w-full disabled:opacity-50">
          {syncing ? "Синхронизирую…" : "🔄 Синхронизировать с Трекером"}
        </button>
        {sync && (
          <div className="rounded-xl border border-brand-300/30 bg-brand-300/10 px-3 py-2 text-xs text-brand-100">
            {sync}
          </div>
        )}
      </div>
    </div>
  );
}
