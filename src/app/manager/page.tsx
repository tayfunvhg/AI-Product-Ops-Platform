import { PageHeader, Section } from "@/components/ui";
import AgentPanel from "@/components/AgentPanel";
import { AGENTS } from "@/lib/agents";
import { ARTIFACT_SECTION } from "@/lib/artifacts";

/**
 * ИИ-менеджер продуктовых процессов — единый хаб всех копилотов.
 *
 * Здесь PO общается с агентами; копилоты-генераторы по итогу публикуют свои
 * артефакты в профильные разделы (кнопка «Опубликовать в раздел» в панели).
 */
export default function ManagerPage() {
  const copilots = AGENTS.filter((a) => a.publishesTo);
  const others = AGENTS.filter((a) => !a.publishesTo);

  return (
    <div className="space-y-8">
      <PageHeader
        title="ИИ-менеджер продуктовых процессов"
        subtitle="Единое рабочее место копилотов. Общайтесь с агентами здесь, а готовые артефакты публикуйте в профильные разделы платформы."
        badge="Хаб копилотов"
      />

      <Section title="Копилоты-генераторы">
        <p className="mb-4 text-sm text-white/55">
          Каждый копилот по итогу работы публикует результат в свой раздел.
          Решение всегда за вами: артефакт можно перегенерировать и опубликовать
          заново.
        </p>
        <div className="grid gap-6 lg:grid-cols-2">
          {copilots.map((a) => (
            <div key={a.id} className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-white/45">
                <span>Публикует в</span>
                <span className="chip border-brand-300/30 bg-brand-300/10 text-brand-100">
                  {a.publishesTo && ARTIFACT_SECTION[a.publishesTo].label}
                </span>
              </div>
              <AgentPanel
                agentId={a.id}
                name={a.name}
                tagline={a.tagline}
                suggestions={a.suggestions}
                greeting={a.greeting}
                requiresMaterials={a.requiresMaterials}
                publishesTo={a.publishesTo}
              />
            </div>
          ))}
        </div>
      </Section>

      {others.length > 0 && (
        <Section title="Другие агенты">
          <p className="mb-4 text-sm text-white/55">
            Помощники по планированию, исполнению и мониторингу — пока без
            публикации артефактов в разделы.
          </p>
          <div className="grid gap-6 lg:grid-cols-2">
            {others.map((a) => (
              <AgentPanel
                key={a.id}
                agentId={a.id}
                name={a.name}
                tagline={a.tagline}
                suggestions={a.suggestions}
                greeting={a.greeting}
                requiresMaterials={a.requiresMaterials}
              />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
