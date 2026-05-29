import { PageHeader, Section } from "@/components/ui";
import AgentPanel from "@/components/AgentPanel";
import { agentsForModule } from "@/lib/agents";
import { VISION, PRESENTATIONS } from "@/lib/mock";

export default function VisionPage() {
  const agents = agentsForModule("vision");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Vision & Strategy"
        subtitle="Текущее видение продукта, стратегические ставки и презентации. Агент помогает актуализировать видение."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Текущее видение">
            <div className="card">
              <p className="text-[15px] leading-relaxed text-white/85">{VISION.current}</p>
              <div className="mt-5">
                <div className="section-title mb-2">Стратегические ставки</div>
                <ul className="space-y-2">
                  {VISION.bets.map((b, i) => (
                    <li key={i} className="flex gap-2 text-sm text-white/75">
                      <span className="text-brand-300">▸</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {VISION.metricsTargets.map((m) => (
                  <span key={m.name} className="chip border-brand-300/30 bg-brand-300/10 text-brand-100">
                    {m.name}: <b className="ml-1 text-white">{m.target}</b>
                  </span>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Презентации">
            <div className="grid gap-4 sm:grid-cols-3">
              {PRESENTATIONS.map((p) => (
                <div key={p.id} className="card">
                  <div className="grid h-20 place-items-center rounded-xl bg-gradient-to-br from-brand-600/30 to-ink-800 text-3xl">
                    🖥️
                  </div>
                  <div className="mt-3 font-medium text-white">{p.title}</div>
                  <div className="mt-1 text-xs text-white/45">
                    {p.slides} слайдов · {p.updated}
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
