"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Persona } from "@/lib/mock";

function PersonaCard({ p }: { p: Persona }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [jtbd, setJtbd] = useState(p.jtbd);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, jtbd }),
      });
      const d = await res.json();
      if (d?.ok) {
        setEditing(false);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-500/20 text-lg">👤</div>
        {p.share ? <span className="chip">{p.share}%</span> : null}
      </div>
      <div className="mt-3 font-semibold text-white">{p.name}</div>
      <div className="text-xs text-white/45">{p.role}</div>

      <div className="mt-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wide text-white/35">Цель (JTBD)</span>
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-xs text-brand-200 hover:text-brand-100">
              ✎ изменить
            </button>
          )}
        </div>
        {editing ? (
          <div className="mt-1 space-y-2">
            <textarea
              value={jtbd}
              onChange={(e) => setJtbd(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-ink-800/80 px-3 py-2 text-sm text-white outline-none focus:border-brand-300/40"
            />
            <div className="flex gap-2">
              <button onClick={save} disabled={busy || !jtbd.trim()} className="btn-primary disabled:opacity-50">
                Сохранить
              </button>
              <button
                onClick={() => {
                  setJtbd(p.jtbd);
                  setEditing(false);
                }}
                className="btn-ghost"
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-1 text-sm text-white/65">{p.jtbd}</p>
        )}
      </div>

      {p.pains?.length ? (
        <div className="mt-3 space-y-1">
          {p.pains.map((pain) => (
            <div key={pain} className="text-xs text-white/45">
              • {pain}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function PersonasBoard({ personas }: { personas: Persona[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {personas.map((p) => (
        <PersonaCard key={p.id} p={p} />
      ))}
    </div>
  );
}
