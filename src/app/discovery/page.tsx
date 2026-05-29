import { PageHeader, Section } from "@/components/ui";
import AgentPanel from "@/components/AgentPanel";
import { agentsForModule } from "@/lib/agents";
import { PERSONAS, HYPOTHESES, BACKLOG, BRIEFS } from "@/lib/mock";

const STATUS_LABEL: Record<string, string> = {
  new: "Новая",
  "in-test": "В тесте",
  validated: "Подтверждена",
  rejected: "Отклонена",
};

const STATUS_COLOR: Record<string, string> = {
  new: "text-white/60",
  "in-test": "text-amber-300",
  validated: "text-brand-300",
  rejected: "text-rose-400",
};

export default function DiscoveryPage() {
  const agents = agentsForModule("discovery");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Discovery"
        subtitle="Персоны, гипотезы, бэклог и поступающие брифы. Агенты предлагают гипотезы и работают с персонами."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {/* Персоны */}
          <Section title="Персоны 1, 2, 3">
            <div className="grid gap-4 sm:grid-cols-3">
              {PERSONAS.map((p) => (
                <div key={p.id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-500/20 text-lg">
                      👤
                    </div>
                    <span className="chip">{p.share}%</span>
                  </div>
                  <div className="mt-3 font-semibold text-white">{p.name}</div>
                  <div className="text-xs text-white/45">{p.role}</div>
                  <p className="mt-2 text-sm text-white/65">{p.jtbd}</p>
                  <div className="mt-3 space-y-1">
                    {p.pains.map((pain) => (
                      <div key={pain} className="text-xs text-white/45">
                        • {pain}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Гипотезы */}
          <Section title="Список гипотез">
            <div className="card divide-y divide-white/5 p-0">
              {HYPOTHESES.map((h) => {
                const score = h.ice.impact * h.ice.confidence * h.ice.ease;
                return (
                  <div key={h.id} className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${STATUS_COLOR[h.status]}`}>
                          {STATUS_LABEL[h.status]}
                        </span>
                        {h.source === "agent" && (
                          <span className="chip border-brand-300/30 bg-brand-300/10 text-brand-100">
                            🤖 от агента
                          </span>
                        )}
                      </div>
                      <div className="mt-1 truncate font-medium text-white">{h.title}</div>
                      <div className="mt-0.5 text-xs text-white/45">метрика: {h.metric}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-xs text-white/40">ICE</div>
                      <div className="text-lg font-bold text-brand-300">{score}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Бэклог */}
          <Section title="Бэклог">
            <div className="grid gap-3 sm:grid-cols-2">
              {BACKLOG.map((b) => (
                <div key={b.id} className="card">
                  <div className="flex items-center gap-2">
                    <span className="chip">{b.type}</span>
                    <span className="chip">{b.status}</span>
                  </div>
                  <div className="mt-2 font-medium text-white">{b.title}</div>
                  <div className="mt-1 flex items-center justify-between text-xs text-white/45">
                    <span>{b.impact}</span>
                    <span className="font-bold text-brand-300">{b.effort}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Правая колонка: агенты + брифы */}
        <div className="space-y-4">
          <div className="section-title">AI-агенты раздела</div>
          {agents.map((a) => (
            <AgentPanel
              key={a.id}
              agentId={a.id}
              name={a.name}
              tagline={a.tagline}
              suggestions={a.suggestions}
              compact
            />
          ))}

          <div className="section-title pt-2">История поступления брифов</div>
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
                    b.status === "new"
                      ? "border-brand-300/30 bg-brand-300/10 text-brand-100"
                      : ""
                  }`}
                >
                  {b.status === "new" ? "новый" : "обработан"}
                </span>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="section-title">Настройки дайджестов</div>
            <p className="mt-2 text-sm text-white/55">
              Периодичность, каналы и состав авто-дайджестов по Discovery.
            </p>
            <button className="btn-ghost mt-3 w-full">Настроить дайджесты</button>
          </div>
        </div>
      </div>
    </div>
  );
}
