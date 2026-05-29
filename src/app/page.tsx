import Link from "next/link";
import { PageHeader, Sparkline, Section } from "@/components/ui";
import { HEALTH_INDEX, BACKLOG, METRICS } from "@/lib/mock";

export default function HomePage() {
  const nowItems = BACKLOG.filter((b) => b.status === "now");
  const productMetrics = METRICS.filter((m) => m.kind === "product").slice(0, 4);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Главная"
        subtitle="Сводка по здоровью инициатив, динамике и текущему бэклогу. Ваш единый стартовый экран."
        badge="Демо-данные"
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Мой ИЗИ */}
        <div className="card lg:col-span-1">
          <div className="section-title">Мой ИЗИ</div>
          <p className="mt-1 text-xs text-white/40">Индекс здоровья инициатив</p>
          <div className="mt-4 flex items-end gap-3">
            <div className="text-5xl font-black text-white">{HEALTH_INDEX.value}</div>
            <div className="mb-1.5 text-sm font-semibold text-brand-300">
              ▲ {HEALTH_INDEX.delta} за месяц
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {HEALTH_INDEX.breakdown.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-xs text-white/55">
                  <span>{b.label}</span>
                  <span className="text-white/70">{b.value}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-brand-400"
                    style={{ width: `${b.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Динамика ИЗИ */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="section-title">Динамика ИЗИ</div>
              <p className="mt-1 text-xs text-white/40">11 недель</p>
            </div>
            <span className="chip">тренд растёт</span>
          </div>
          <div className="mt-6">
            <Sparkline data={HEALTH_INDEX.history} good width={640} height={140} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {productMetrics.map((m) => (
              <div key={m.id} className="rounded-xl border border-white/5 bg-ink-800/50 p-3">
                <div className="truncate text-xs text-white/45">{m.name}</div>
                <div className="mt-1 text-lg font-bold text-white">{m.value}</div>
                <div className={`text-xs font-semibold ${m.good ? "text-brand-300" : "text-rose-400"}`}>
                  {m.trend === "up" ? "▲" : "▼"} {m.delta}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Бэклог */}
      <Section
        title="Бэклог — в работе сейчас"
        right={
          <Link href="/discovery" className="text-xs text-brand-300 hover:underline">
            весь бэклог →
          </Link>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          {nowItems.map((b) => (
            <div key={b.id} className="card flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="chip">{b.type}</span>
                  <span className="chip">{b.okr}</span>
                </div>
                <div className="mt-2 font-semibold text-white">{b.title}</div>
                <div className="mt-1 text-sm text-white/50">Эффект: {b.impact}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-xs text-white/40">оценка</div>
                <div className="text-lg font-bold text-brand-300">{b.effort}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
