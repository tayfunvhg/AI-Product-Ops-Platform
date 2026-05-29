"use client";

import { useState } from "react";
import { ROLES } from "@/lib/mock";

export default function Topbar() {
  const [role, setRole] = useState(ROLES[0]);

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/5 bg-ink-900/80 px-6 py-3 backdrop-blur lg:px-10">
      <div className="flex items-center gap-3">
        <div className="hidden text-sm text-white/45 sm:block">AI Product Ops</div>
        <span className="hidden text-white/20 sm:block">/</span>
        <div className="text-sm font-medium text-white/80">Прототип платформы</div>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5">
          <span className="text-xs text-white/45">Роль</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="bg-transparent text-sm font-medium text-white outline-none"
          >
            {ROLES.map((r) => (
              <option key={r} value={r} className="bg-ink-800">
                {r}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-sm font-medium text-white">Пользователь</div>
            <div className="text-[11px] text-white/45">{role}</div>
          </div>
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-ink-900">
            ПО
          </div>
        </div>
      </div>
    </header>
  );
}
