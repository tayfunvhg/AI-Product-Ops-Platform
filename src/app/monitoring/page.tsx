import { PageHeader, CopilotsHint } from "@/components/ui";
import MetricsBoard from "@/components/MetricsBoard";
import RunRateTable from "@/components/RunRateTable";
import { METRICS, ALERTS, type Alert } from "@/lib/mock";
import { getRunRate } from "@/lib/repo";

function AlertCard({ a }: { a: Alert }) {
  const color =
    a.severity === "high"
      ? "border-rose-500/40 bg-rose-500/10"
      : a.severity === "medium"
      ? "border-amber-500/40 bg-amber-500/10"
      : "border-white/10 bg-white/5";
  const dot =
    a.severity === "high" ? "bg-rose-400" : a.severity === "medium" ? "bg-amber-400" : "bg-white/40";
  return (
    <div className={`rounded-2xl border p-4 ${color}`}>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <span className="text-sm font-semibold text-white">{a.title}</span>
        <span className="ml-auto text-xs text-white/40">{a.time}</span>
      </div>
      <div className="mt-1 text-xs text-white/45">метрика: {a.metric}</div>
      <p className="mt-2 text-sm text-white/70">{a.note}</p>
    </div>
  );
}

export default function MonitoringPage() {
  const productMetrics = METRICS.filter((m) => m.kind === "product");
  const productionMetrics = METRICS.filter((m) => m.kind === "production");
  const productAlerts = ALERTS.filter((a) => a.kind === "product");
  const productionAlerts = ALERTS.filter((a) => a.kind === "production");
  const runRate = getRunRate();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Monitoring & Alert"
        subtitle="Продуктовые и производственные метрики с динамикой план/факт, RunRate и алертами."
      />

      <CopilotsHint note="«Генератор метрик» и агент-монитор теперь в ИИ-менеджере. RunRate публикуется в таблицу ниже." />

      {/* Плашки метрик: клик раскрывает график динамики (план/факт). */}
      <MetricsBoard product={productMetrics} production={productionMetrics} />

      {/* RunRate-таблица — только для продуктовых метрик. */}
      <RunRateTable data={runRate} />

      {/* Алерты — результат работы агентов-мониторов (в перспективе — реалтайм). */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Алерты</h2>
          <span className="chip border-brand-300/30 bg-brand-300/10 text-brand-100">
            от агентов-мониторов
          </span>
        </div>
        <div className="grid gap-8 xl:grid-cols-2">
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-wide text-white/40">Продуктовые</div>
            {productAlerts.length ? (
              productAlerts.map((a) => <AlertCard key={a.id} a={a} />)
            ) : (
              <p className="text-sm text-white/40">Аномалий не обнаружено.</p>
            )}
          </div>
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-wide text-white/40">Производственные</div>
            {productionAlerts.length ? (
              productionAlerts.map((a) => <AlertCard key={a.id} a={a} />)
            ) : (
              <p className="text-sm text-white/40">Аномалий не обнаружено.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
