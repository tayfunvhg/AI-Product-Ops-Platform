import { PageHeader, Section } from "@/components/ui";
import AgentPanel from "@/components/AgentPanel";
import { agentsForModule } from "@/lib/agents";
import { ROADMAP, BACKLOG } from "@/lib/mock";

const COLUMNS: { key: "now" | "next" | "later"; label: string }[] = [
  { key: "now", label: "Now" },
  { key: "next", label: "Next" },
  { key: "later", label: "Later" },
];

export default function TacticalPage() {
  const agents = agentsForModule("tactical");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tactical Planning"
        subtitle="Черновик OKR и роадмап Now / Next / Later. Агент готовит к квартальному планированию по бэклогу."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Section title="OKR квартала (черновик)">
            <div className="space-y-4">
              {ROADMAP.map((o, i) => (
                <div key={i} className="card">
                  <div className="font-semibold text-white">{o.objective}</div>
                  <ul className="mt-3 space-y-2">
                    {o.keyResults.map((kr, j) => (
                      <li
                        key={j}
                        className="flex items-center justify-between rounded-xl border border-white/5 bg-ink-800/50 px-3 py-2 text-sm"
                      >
                        <span className="text-white/80">{kr.text}</span>
                        <span className="chip">{kr.metric}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Роадмап">
            <div className="grid gap-4 sm:grid-cols-3">
              {COLUMNS.map((col) => (
                <div key={col.key} className="rounded-2xl border border-white/5 bg-ink-800/40 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{col.label}</span>
                    <span className="chip">
                      {BACKLOG.filter((b) => b.status === col.key).length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {BACKLOG.filter((b) => b.status === col.key).map((b) => (
                      <div key={b.id} className="rounded-xl border border-white/5 bg-ink-700/60 p-3">
                        <div className="text-sm font-medium text-white">{b.title}</div>
                        <div className="mt-1 flex items-center justify-between text-xs text-white/45">
                          <span>{b.okr}</span>
                          <span className="font-bold text-brand-300">{b.effort}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <div className="space-y-4">
          <div className="section-title">AI-агенты раздела</div>
          {agents.map((a) => (
            <AgentPanel
              key={a.id}
              agentId={a.id}
              name={a.name}
              tagline={a.tagline}
              suggestions={a.suggestions}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
