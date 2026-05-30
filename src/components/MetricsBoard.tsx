"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Metric } from "@/lib/mock";

// Plan vs fact colors, tuned for the dark green theme:
// Факт — brand green (the "real" line), План — soft indigo (the target).
const COLOR_PLAN = "#8aa0ff";
const COLOR_FACT = "#5fe39e";

function MetricCard({
  m,
  active,
  onClick,
}: {
  m: Metric;
  active: boolean;
  onClick: () => void;
}) {
  const hasChart = !!m.series?.length;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!hasChart}
      className={`card text-left transition ${
        hasChart ? "hover:ring-1 hover:ring-brand-300/40" : "cursor-default"
      } ${active ? "ring-1 ring-brand-300/60" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="text-sm text-white/55">{m.name}</div>
        <span className={`text-xs font-semibold ${m.good ? "text-brand-300" : "text-rose-400"}`}>
          {m.trend === "up" ? "▲" : m.trend === "down" ? "▼" : "—"} {m.delta}
        </span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="text-3xl font-bold text-white">{m.value}</div>
        {hasChart && (
          <span className="text-[11px] text-white/35">{active ? "скрыть ▾" : "динамика ▸"}</span>
        )}
      </div>
    </button>
  );
}

function ChartTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-semibold text-white/80">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/60">{p.name}:</span>
          <span className="font-semibold text-white">
            {p.value}
            {unit ?? ""}
          </span>
        </div>
      ))}
    </div>
  );
}

function MetricChart({ m }: { m: Metric }) {
  if (!m.series?.length) return null;
  const axis = { stroke: "#ffffff40", fontSize: 11 };
  const isProduct = m.kind === "product";

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-semibold text-white">{m.name}</div>
        <div className="flex items-center gap-4 text-xs text-white/50">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: COLOR_PLAN }} /> План
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: COLOR_FACT }} /> Факт
          </span>
        </div>
      </div>
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          {isProduct ? (
            <AreaChart data={m.series} margin={{ top: 6, right: 12, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id={`plan-${m.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLOR_PLAN} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={COLOR_PLAN} stopOpacity={0} />
                </linearGradient>
                <linearGradient id={`fact-${m.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLOR_FACT} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={COLOR_FACT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="period" {...axis} />
              <YAxis {...axis} width={40} />
              <Tooltip content={<ChartTooltip unit={m.unit} />} />
              <Area
                type="monotone"
                dataKey="plan"
                name="План"
                stroke={COLOR_PLAN}
                fill={`url(#plan-${m.id})`}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="fact"
                name="Факт"
                stroke={COLOR_FACT}
                fill={`url(#fact-${m.id})`}
                strokeWidth={2}
              />
              <Brush
                dataKey="period"
                height={22}
                stroke="#5fe39e80"
                fill="#0d1117"
                travellerWidth={8}
              />
            </AreaChart>
          ) : (
            <BarChart data={m.series} margin={{ top: 6, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="period" {...axis} />
              <YAxis {...axis} width={40} />
              <Tooltip content={<ChartTooltip unit={m.unit} />} cursor={{ fill: "#ffffff08" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="plan" name="План" fill={COLOR_PLAN} radius={[3, 3, 0, 0]} />
              <Bar dataKey="fact" name="Факт" fill={COLOR_FACT} radius={[3, 3, 0, 0]} />
              <Brush
                dataKey="period"
                height={22}
                stroke="#5fe39e80"
                fill="#0d1117"
                travellerWidth={8}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Group({
  title,
  metrics,
  selected,
  onSelect,
}: {
  title: string;
  metrics: Metric[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const open = metrics.find((m) => m.id === selected) ?? null;
  return (
    <div className="space-y-4">
      <h2 className="section-title">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {metrics.map((m) => (
          <MetricCard
            key={m.id}
            m={m}
            active={m.id === selected}
            onClick={() => onSelect(m.id)}
          />
        ))}
      </div>
      {open && <MetricChart m={open} />}
    </div>
  );
}

export default function MetricsBoard({
  product,
  production,
}: {
  product: Metric[];
  production: Metric[];
}) {
  // One selected metric per group, toggled on click.
  const [selProduct, setSelProduct] = useState<string | null>(null);
  const [selProduction, setSelProduction] = useState<string | null>(null);
  const toggle = (cur: string | null, id: string) => (cur === id ? null : id);

  return (
    <div className="grid gap-8 xl:grid-cols-2">
      <Group
        title="Мои продуктовые метрики"
        metrics={product}
        selected={selProduct}
        onSelect={(id) => setSelProduct((c) => toggle(c, id))}
      />
      <Group
        title="Мои производственные метрики"
        metrics={production}
        selected={selProduction}
        onSelect={(id) => setSelProduction((c) => toggle(c, id))}
      />
    </div>
  );
}
