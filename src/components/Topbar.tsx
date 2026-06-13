"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ROLES } from "@/lib/mock";

type Product = { id: string; name: string; tagline?: string };

export default function Topbar() {
  const router = useRouter();
  const [role, setRole] = useState(ROLES[0]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeProduct, setActiveProduct] = useState<string>("");

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) {
          setProducts(d.products);
          setActiveProduct(d.active);
        }
      })
      .catch(() => {});
  }, []);

  async function switchProduct(id: string) {
    if (!id || id === activeProduct) return;
    const prev = activeProduct;
    setActiveProduct(id); // optimistic
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const d = await res.json();
      if (!d?.ok) {
        setActiveProduct(prev);
      } else {
        // Артефакты и состояние конвейера привязаны к продукту — перерисуем серверные данные.
        router.refresh();
      }
    } catch {
      setActiveProduct(prev);
    }
  }

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/5 bg-ink-900/80 px-6 py-3 backdrop-blur lg:px-10">
      <div className="flex items-center gap-3">
        <div className="hidden text-sm text-white/45 sm:block">AI Product Ops</div>
        <span className="hidden text-white/20 sm:block">/</span>
        <div className="text-sm font-medium text-white/80">Прототип платформы</div>
      </div>

      <div className="flex items-center gap-3">
        {products.length > 0 && (
          <label className="flex items-center gap-2 rounded-xl border border-brand-300/30 bg-brand-300/10 px-3 py-1.5">
            <span className="text-xs text-brand-100/70">Продукт</span>
            <select
              value={activeProduct}
              onChange={(e) => switchProduct(e.target.value)}
              className="bg-transparent text-sm font-semibold text-brand-100 outline-none"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id} className="bg-ink-800 text-white">
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}

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
