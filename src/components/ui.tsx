import React from "react";
import type { Trend } from "@/lib/mock";

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
