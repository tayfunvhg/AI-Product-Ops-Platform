import { Section, CopilotsHint } from "@/components/ui";
import { PRESENTATIONS } from "@/lib/mock";
import { getVision } from "@/lib/repo";
import VisionExport from "@/components/VisionExport";
import MaterialsPanel from "@/components/MaterialsPanel";

export default function VisionPage() {
  // Latest published vision artifact, falling back to the mock seed.
  const V = getVision();

  const materials = PRESENTATIONS.map((p) => ({
    id: p.id,
    title: p.title,
    meta: `${p.slides} слайдов · ${p.updated}`,
  }));

  return (
    <div className="space-y-8">
      {/* Заголовок + экспорт в Confluence */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Видение и стратегия</h1>
          <p className="mt-1 max-w-2xl text-sm text-white/50">
            Продуктовое видение — результат работы копилота. Слева — образ продукта и
            ценность, справа — стратегические ставки, ниже — цели и материалы.
          </p>
        </div>
        <VisionExport />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Основное: видение + возможности персон + цели */}
        <div className="space-y-6 lg:col-span-2">
          <Section title="Текущее видение">
            <div className="card space-y-5">
              <p className="text-[15px] leading-relaxed text-white/85">{V.current}</p>

              {V.personaValue?.length ? (
                <div>
                  <div className="section-title mb-2">Представьте, что у пользователей будет</div>
                  <ul className="space-y-2">
                    {V.personaValue.map((p, i) => (
                      <li key={i} className="flex gap-2 text-sm text-white/75">
                        <span className="text-brand-300">▸</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* Цели — плашками (как в текущем визуале) */}
              {V.metricsTargets?.length ? (
                <div>
                  <div className="section-title mb-2">Ключевые цели</div>
                  <div className="flex flex-wrap gap-2">
                    {V.metricsTargets.map((m) => (
                      <span
                        key={m.name}
                        className="chip border-brand-300/30 bg-brand-300/10 text-brand-100"
                      >
                        {m.name}: <b className="ml-1 text-white">{m.target}</b>
                      </span>
                    ))}
                  </div>
                  {V.goalsBase?.length ? (
                    <p className="mt-2 text-xs text-white/40">
                      База: {V.goalsBase.map((g) => `${g.name} — ${g.value}`).join(" · ")}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </Section>

          {V.context ? (
            <Section title="Контекст и риски">
              <div className="card">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/70">
                  {V.context}
                </p>
              </div>
            </Section>
          ) : null}
        </div>

        {/* Правая колонка: стратегические ставки + хаб */}
        <div className="space-y-6">
          <Section title="Стратегические ставки">
            <div className="card space-y-4">
              {V.strategyByYear?.length ? (
                V.strategyByYear.map((s, i) => (
                  <div key={i} className="border-l-2 border-brand-400/40 pl-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white">
                        {s.year} — {s.title}
                      </span>
                      {s.orientir && (
                        <span className="chip border-brand-300/30 bg-brand-300/10 text-brand-100">
                          {s.orientir}
                        </span>
                      )}
                    </div>
                    {s.results?.length ? (
                      <ul className="mt-1.5 space-y-1">
                        {s.results.map((r, j) => (
                          <li key={j} className="text-sm text-white/65">
                            • {r}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))
              ) : (
                <ul className="space-y-2">
                  {V.bets.map((b, i) => (
                    <li key={i} className="flex gap-2 text-sm text-white/75">
                      <span className="text-brand-300">▸</span>
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Section>

          <CopilotsHint note="Видение формирует копилот «Vision Writer» в ИИ-менеджере. Опубликуйте результат — он появится здесь." />
        </div>
      </div>

      {/* Материалы + Проанализировать */}
      <MaterialsPanel initial={materials} />
    </div>
  );
}
