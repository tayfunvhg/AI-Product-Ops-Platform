"use client";

import { useEffect, useState } from "react";

type Option = { id: string; label: string; sub: string; provider: string };

export default function ModelSelector() {
  const [options, setOptions] = useState<Option[]>([]);
  const [active, setActive] = useState<string>("");
  const [available, setAvailable] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings/model")
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) {
          setOptions(d.options);
          setActive(d.active);
          setAvailable(d.available ?? {});
        }
      })
      .catch(() => {});
  }, []);

  async function choose(id: string) {
    if (id === active) return;
    setSaving(id);
    try {
      const res = await fetch("/api/settings/model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const d = await res.json();
      if (d?.ok) {
        setActive(d.active);
        if (d.available) setAvailable(d.available);
      }
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-3">
      {options.map((o, i) => {
        const isActive = o.id === active;
        const ok = available[o.id];
        return (
          <button
            key={o.id}
            onClick={() => choose(o.id)}
            disabled={saving !== null}
            className={`w-full rounded-2xl border p-4 text-left transition ${
              isActive
                ? "border-brand-300/60 bg-brand-300/10 ring-1 ring-brand-300/40"
                : "border-white/10 bg-ink-800/50 hover:border-brand-300/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                  isActive ? "border-brand-300 bg-brand-300 text-ink-900" : "border-white/30"
                }`}
              >
                {isActive ? "✓" : ""}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">
                    {i + 1}. {o.label}
                  </span>
                  {isActive && (
                    <span className="chip border-brand-300/30 bg-brand-300/10 text-brand-100">
                      активна
                    </span>
                  )}
                  {ok === false && (
                    <span className="chip border-amber-400/30 bg-amber-400/10 text-amber-200">
                      нет ключа
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-sm text-white/50">{o.sub}</div>
              </div>
              {saving === o.id && <span className="text-xs text-white/40">сохраняю…</span>}
            </div>
          </button>
        );
      })}
      <p className="text-xs text-white/40">
        Выбор применяется ко всем агентам и копилотам. Ключи хранятся на сервере (.env.local) и
        не попадают в браузер.
      </p>
    </div>
  );
}
