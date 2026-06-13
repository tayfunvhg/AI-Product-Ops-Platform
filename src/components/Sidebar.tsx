"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Главная", icon: "🏠" },
  { href: "/manager", label: "ИИ-менеджер", icon: "🧠" },
  { href: "/vision", label: "Видение", icon: "🧭" },
  { href: "/discovery", label: "Discovery", icon: "🔎" },
  { href: "/tactical", label: "Tactical Planning", icon: "🗂️" },
  { href: "/execution", label: "Execution", icon: "⚙️" },
  { href: "/monitoring", label: "Метрики и алерты", icon: "📈" },
];

const NAV_BOTTOM = [{ href: "/settings", label: "Настройки", icon: "⚙️" }];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const Item = ({ href, label, icon }: { href: string; label: string; icon: string }) => (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
        isActive(href)
          ? "bg-brand-300/15 text-brand-100 ring-1 ring-brand-300/30"
          : "text-white/65 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span className="text-base leading-none">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/5 bg-ink-800 px-4 py-5 md:flex">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-ink-900">
          <span className="text-lg font-black">AI</span>
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold text-white">Product Ops</div>
          <div className="text-[11px] text-white/45">платформа с ИИ</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((n) => (
          <Item key={n.href} {...n} />
        ))}
      </nav>

      <div className="flex flex-col gap-1 border-t border-white/5 pt-3">
        {NAV_BOTTOM.map((n) => (
          <Item key={n.href} {...n} />
        ))}
      </div>
    </aside>
  );
}
