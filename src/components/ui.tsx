import React from "react";
import Link from "next/link";
import type { Trend } from "@/lib/mock";

/**
 * Pointer card shown where a section's AI agents used to live. All copilots now
 * live in the "ИИ-менеджер" hub and publish their results back into sections.
 */
export function CopilotsHint({ note }: { note?: string }) {
  return (
    <Link
      href="/manager"
      className="card-green block transition hover:ring-1 hover:ring-brand-300/40"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-500/90 text-ink-900">
          🧠
        </div>
        <div>
          <div className="font-semibold text-white">Копилоты — в разделе «ИИ-менеджер»</div>
          <p className="mt-0.5 text-sm text-white/55">
            {note ?? "Все ИИ-агенты собраны в одном месте. Результат публикуется сюда."}
          </p>
        </div>
        <span className="ml-auto text-brand-200">→</span>
      </div>
    </Link>
  );
}

export function PageHeader({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-white/50">{subtitle}</p>}
      </div>
      {badge && (
        <span className="chip border-brand-300/30 bg-brand-300/10 text-brand-100">{badge}</span>
      )}
    </div>
  );
}

export function Sparkline({
  data,
  good = true,
  width = 120,
  height = 36,
}: {
  data: number[];
  good?: boolean;
  width?: number;
  height?: number;
}) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1 || 1);
  const points = data
    .map((d, i) => {
      const x = i * step;
      const y = height - ((d - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const stroke = good ? "#5fe39e" : "#f7768e";

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrendBadge({ trend, good, delta }: { trend: Trend; good: boolean; delta: string }) {
  const color = good ? "text-brand-300" : "text-rose-400";
  const arrow = trend === "up" ? "▲" : trend === "down" ? "▼" : "—";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${color}`}>
      {arrow} {delta}
    </span>
  );
}

export function Section({
  title,
  children,
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="section-title">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}
