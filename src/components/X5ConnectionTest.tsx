"use client";

import { useState } from "react";

type Health = {
  ok: boolean;
  configured: boolean;
  model?: string;
  authMode?: string;
  endpoint?: string;
  latencyMs?: number;
  status?: number;
  sample?: string;
  message: string;
};

export default function X5ConnectionTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Health | null>(null);

  async function check() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/x5/health", { cache: "no-store" });
      setResult(await res.json());
    } catch (e) {
      setResult({
        ok: false,
        configured: true,
        message: "Ошибка сети при проверке подключения.",
      });
    } finally {
      setLoading(false);
    }
  }

  const statusColor = !result
    ? "bg-white/20"
    : result.ok
    ? "bg-brand-400"
    : result.configured
    ? "bg-rose-400"
    : "bg-amber-400";

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={`h-2.5 w-2.5 rounded-full ${statusColor}`} />
          <div>
            <div className="font-semibold text-white">X5 Copilot — подключение</div>
            <div className="text-xs text-white/45">LLM для ИИ-агентов платформы</div>
          </div>
        </div>
        <button onClick={check} disabled={loading} className="btn-primary disabled:opacity-50">
          {loading ? "Проверяем…" : "Проверить подключение"}
        </button>
      </div>

      {result && (
        <div className="mt-4 rounded-xl border border-white/5 bg-ink-800/60 p-4 text-sm">
          <p className={result.ok ? "text-brand-200" : "text-rose-300"}>{result.message}</p>
          {result.configured && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/55 sm:grid-cols-4">
              {result.model && <Info label="Модель" value={result.model} />}
              {result.authMode && <Info label="Auth" value={result.authMode} />}
              {typeof result.status === "number" && (
                <Info label="HTTP" value={String(result.status)} />
              )}
              {typeof result.latencyMs === "number" && (
                <Info label="Задержка" value={`${result.latencyMs} мс`} />
              )}
            </div>
          )}
          {result.sample && (
            <pre className="mt-3 overflow-x-auto rounded-lg bg-black/30 p-2 text-[11px] text-white/60">
              {result.sample}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/5 px-2 py-1.5">
      <div className="text-white/35">{label}</div>
      <div className="mt-0.5 font-medium text-white/80">{value}</div>
    </div>
  );
}
