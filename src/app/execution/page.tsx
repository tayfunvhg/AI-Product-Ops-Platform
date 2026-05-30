import { Section, CopilotsHint } from "@/components/ui";
import { BACKLOG } from "@/lib/mock";
import TrackerSyncButton from "@/components/TrackerSyncButton";

const EXEC_STATES = [
  { key: "В работе", color: "text-amber-300", items: ["Онбординг в 2 шага", "Исследование оттока на 9-й неделе"] },
  { key: "На ревью", color: "text-brand-300", items: ["Push о незавершённой корзине"] },
  { key: "Готово", color: "text-white/50", items: ["Аналитика воронки активации", "A/B баннер главной"] },
];

export default function ExecutionPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Execution</h1>
          <p className="mt-1 max-w-2xl text-sm text-white/50">
            Доставка инициатив, статусы и синхронизация с Трекером. Новые задачи уходят на
            доску, существующие — сверяются.
          </p>
        </div>
        <TrackerSyncButton />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Section title="Поток исполнения">
            <div className="grid gap-4 sm:grid-cols-3">
              {EXEC_STATES.map((s) => (
                <div key={s.key} className="rounded-2xl border border-white/5 bg-ink-800/40 p-3">
                  <div className={`mb-3 text-sm font-semibold ${s.color}`}>{s.key}</div>
                  <div className="space-y-2">
                    {s.items.map((it) => (
                      <div key={it} className="rounded-xl border border-white/5 bg-ink-700/60 p-3 text-sm text-white/80">
                        {it}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Связь с инициативами">
            <div className="grid gap-3 sm:grid-cols-2">
              {BACKLOG.filter((b) => b.status === "now" || b.status === "next").map((b) => (
                <div key={b.id} className="card flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">{b.title}</div>
                    <div className="text-xs text-white/45">{b.okr}</div>
                  </div>
                  <span className="chip">{b.status}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <div className="space-y-4">
          <CopilotsHint note="Агент исполнения живёт в ИИ-менеджере." />
        </div>
      </div>
    </div>
  );
}
