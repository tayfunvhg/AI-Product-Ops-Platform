import type { RunRatePayload } from "@/lib/artifacts";

/**
 * RunRate table for the monitoring section (product metrics only).
 *
 * Shows the planned trajectory grouped by the PO's goals — the single grouped
 * table from metric-generator v2.5. Only plan values are known here; fact and Δ
 * are pulled from Insight dashboards later (integration, Этап F), shown as "—".
 */
export default function RunRateTable({ data }: { data: RunRatePayload }) {
  const { periods, goals, product, date } = data;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="section-title">RunRate — плановые значения</h2>
        <div className="text-xs text-white/40">
          {product}
          {date ? ` · ${date}` : ""} · только план (факт — из Insight, интеграция позже)
        </div>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/50">
              <th className="px-4 py-3 text-left font-medium">Цель / метрика</th>
              {periods.map((p) => (
                <th key={p} className="px-4 py-3 text-right font-medium whitespace-nowrap">
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {goals.map((g, gi) => (
              <GoalRows key={gi} goal={g.goal} metrics={g.metrics} cols={periods.length} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GoalRows({
  goal,
  metrics,
  cols,
}: {
  goal: string;
  metrics: { name: string; values: string[] }[];
  cols: number;
}) {
  return (
    <>
      <tr className="border-b border-white/5 bg-white/[0.03]">
        <td className="px-4 py-2.5 font-semibold text-white" colSpan={cols + 1}>
          {goal}
        </td>
      </tr>
      {metrics.map((m, mi) => (
        <tr key={mi} className="border-b border-white/5 last:border-0">
          <td className="px-4 py-2.5 pl-6 text-white/75">{m.name}</td>
          {Array.from({ length: cols }).map((_, ci) => (
            <td key={ci} className="px-4 py-2.5 text-right tabular-nums text-white/85">
              {m.values[ci] ?? "—"}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
