"use client";

import { useState } from "react";

/** Reusable "Синхронизировать с Трекером" button (stub integration). */
export default function TrackerSyncButton() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function sync() {
    setSyncing(true);
    setResult(null);
    try {
      const res = await fetch("/api/integrations/tracker", { method: "POST" });
      const d = await res.json();
      setResult(
        d?.ok
          ? `Отправлено: ${d.pushed}, сверено: ${d.matched}. ${d.note}`
          : "Не удалось синхронизировать"
      );
    } catch {
      setResult("Ошибка сети при синхронизации");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button onClick={sync} disabled={syncing} className="btn-ghost disabled:opacity-50">
        {syncing ? "Синхронизирую…" : "🔄 Синхронизировать с Трекером"}
      </button>
      {result && (
        <div className="max-w-xs rounded-xl border border-brand-300/30 bg-brand-300/10 px-3 py-2 text-xs text-brand-100">
          {result}
        </div>
      )}
    </div>
  );
}
