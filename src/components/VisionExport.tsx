"use client";

import { useState } from "react";

/** "Вынести в Confluence" — exports the current vision (stub integration). */
export default function VisionExport() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ url?: string; note: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function exportToConfluence() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations/confluence", { method: "POST" });
      const data = await res.json();
      if (!data?.ok) setError(data?.error ?? "Не удалось выгрузить");
      else setResult({ url: data.url, note: data.note });
    } catch {
      setError("Ошибка сети при выгрузке");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button onClick={exportToConfluence} disabled={busy} className="btn-ghost disabled:opacity-50">
        {busy ? "Выгружаю…" : "📄 Вынести в Confluence"}
      </button>
      {result && (
        <div className="max-w-xs rounded-xl border border-brand-300/30 bg-brand-300/10 px-3 py-2 text-xs text-brand-100">
          ✅ Страница создана:{" "}
          <a href={result.url} target="_blank" rel="noreferrer" className="font-semibold underline">
            открыть
          </a>
          <div className="mt-1 text-white/45">{result.note}</div>
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">
          {error}
        </div>
      )}
    </div>
  );
}
