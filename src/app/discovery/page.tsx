import { PageHeader, Section, CopilotsHint } from "@/components/ui";
import { BRIEFS, HYPO_ALERTS, RESEARCH } from "@/lib/mock";
import { getHypotheses, getPersonas } from "@/lib/repo";
import HypothesisBacklog from "@/components/HypothesisBacklog";
import PersonasBoard from "@/components/PersonasBoard";
import MaterialsPanel from "@/components/MaterialsPanel";

export default function DiscoveryPage() {
  const hypotheses = getHypotheses();
  const personas = getPersonas();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Discovery"
        subtitle="Персоны, гипотезы и исследования. Генератор гипотез предлагает идеи на основе всех материалов; решение — за вами."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Основное: персоны + алерты генератора */}
        <div className="space-y-8 lg:col-span-2">
          <Section title="Портреты персон">
            <PersonasBoard personas={personas} />
          </Section>

          <Section
            title="Алерты генератора"
            right={
              <span className="chip border-brand-300/30 bg-brand-300/10 text-brand-100">
                на что обратить внимание
              </span>
            }
          >
            <div className="space-y-2">
              {HYPO_ALERTS.map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100"
                >
                  ⚠️ {a.text}
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Правая колонка: бэклог гипотез (предложения + бэклог + синк) */}
        <div className="space-y-4">
          <CopilotsHint note="Гипотезы и персоны генерируют копилоты в ИИ-менеджере и публикуют сюда." />
          <HypothesisBacklog hypotheses={hypotheses} />

          <div className="section-title pt-2">Поступившие брифы</div>
          <div className="card p-0">
            {BRIEFS.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-3 border-b border-white/5 p-3 last:border-0"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-white">{b.title}</div>
                  <div className="text-xs text-white/45">
                    {b.from} · {b.date}
                  </div>
                </div>
                <span
                  className={`chip shrink-0 ${
                    b.status === "new" ? "border-brand-300/30 bg-brand-300/10 text-brand-100" : ""
                  }`}
                >
                  {b.status === "new" ? "новый" : "обработан"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Результаты исследований */}
      <MaterialsPanel
        title="Результаты исследований"
        initial={RESEARCH.map((r) => ({ id: r.id, title: r.title, meta: r.meta }))}
      />
    </div>
  );
}
