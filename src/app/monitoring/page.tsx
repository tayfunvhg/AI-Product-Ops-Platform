import { PageHeader, Sparkline } from "@/components/ui";
import AgentPanel from "@/components/AgentPanel";
import { agentsForModule } from "@/lib/agents";
import { METRICS, ALERTS, type Metric, type Alert } from "@/lib/mock";

function MetricCard({ m }: { m: Metric }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="text-sm text-white/55">{m.name}</div>
        <span className={`text-xs font-semibold ${m.good ? "text-brand-300" : "text-rose-400"}`}>
          {m.trend === "up" ? "▲" : m.trend === "down" ? "▼" : "—"} {m.delta}
        </span>
      </div>
      <div className="mt-2 flex items-end justify-between">
        <div className="text-3xl font-bold text-white">{m.value}</div>
        <Sparkline data={m.spark} good={m.good} />
      </div>
    </div>
  );
}

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

function Column({
  title,
  metrics,
  alerts,
}: {
  title: string;
  metrics: Metric[];
  alerts: Alert[];
}) {
  return (
    <div className="space-y-4">
      <h2 className="section-title">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {metrics.map((m) => (
          <MetricCard key={m.id} m={m} />
        ))}
      </div>
      <div className="space-y-3">
        {alerts.map((a) => (
          <AlertCard key={a.id} a={a} />
        ))}
      </div>
    </div>
  );
}

export default function MonitoringPage() {
  const monitoringAgents = agentsForModule("monitoring");
  const metricGen = monitoringAgents.find((a) => a.id === "metric-generator");
  const watcher = monitoringAgents.find((a) => a.id === "monitoring-agent");
  const productMetrics = METRICS.filter((m) => m.kind === "product");
  const productionMetrics = METRICS.filter((m) => m.kind === "production");
  const productAlerts = ALERTS.filter((a) => a.kind === "product");
  const productionAlerts = ALERTS.filter((a) => a.kind === "production");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Monitoring & Alert"
        subtitle="Продуктовые и производственные метрики с алертами. Агенты помогают сформировать метрики и объяснить алерты."
      />

      {metricGen && (
        <div>
          <h2 className="section-title mb-3">Генератор метрик</h2>
          <AgentPanel
            agentId={metricGen.id}
            name={metricGen.name}
            tagline={metricGen.tagline}
            suggestions={metricGen.suggestions}
            greeting={metricGen.greeting}
            requiresMaterials={metricGen.requiresMaterials}
            featured
          />
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-2">
        <Column title="Мои продуктовые метрики" metrics={productMetrics} alerts={productAlerts} />
        <Column
          title="Мои производственные метрики"
          metrics={productionMetrics}
          alerts={productionAlerts}
        />
      </div>

      <div className="max-w-3xl">
        <h2 className="section-title mb-3">Цифровой агент по мониторингу</h2>
        {watcher && (
          <AgentPanel
            agentId={watcher.id}
            name={watcher.name}
            tagline={watcher.tagline}
            suggestions={watcher.suggestions}
          />
        )}
      </div>
    </div>
  );
}
