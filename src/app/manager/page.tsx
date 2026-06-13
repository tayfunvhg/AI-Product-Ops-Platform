import { PageHeader, Section } from "@/components/ui";
import AgentPanel from "@/components/AgentPanel";
import PipelineBoard from "@/components/PipelineBoard";
import { AGENTS, getAgent } from "@/lib/agents";
import { PIPELINE } from "@/lib/pipeline";
import { getPipelineState } from "@/lib/repo";

function brief(id?: string) {
  if (!id) return null;
  const a = getAgent(id);
  return a
    ? {
        id: a.id,
        name: a.name,
        tagline: a.tagline,
        status: a.status ?? null,
        suggestions: a.suggestions ?? [],
        greeting: a.greeting ?? null,
        requiresMaterials: a.requiresMaterials ?? false,
        publishesTo: a.publishesTo ?? null,
      }
    : null;
}

/**
 * ИИ-менеджер продуктовых процессов.
 *
 * Сверху — конвейер «Запуск → Валидация продукта» с жёстким гейтингом: каждый
 * этап (генератор + эватор) открывает следующий только после успешной валидации.
 * Ниже — каталог остальных копилотов (Discovery, тактика, операции, мониторинг).
 */
export default function ManagerPage() {
  const stages = PIPELINE.map((s) => ({
    id: s.id,
    n: s.n,
    title: s.title,
    gen: brief(s.genAgent),
    eval: brief(s.evalAgent),
  }));
  const state = getPipelineState();

  const pipelineIds = new Set(
    PIPELINE.flatMap((s) => [s.genAgent, s.evalAgent]).filter(Boolean) as string[]
  );
  const catalog = AGENTS.filter((a) => !pipelineIds.has(a.id));

  return (
    <div className="space-y-8">
      <PageHeader
        title="ИИ-менеджер продуктовых процессов"
        subtitle="Проработайте продукт по этапам и провалидируйте артефакты. Следующий этап открывается после успешной валидации. Клик по блоку открывает чат с агентом."
        badge="Конвейер копилотов"
      />

      <Section title="Конвейер продукта">
        <PipelineBoard stages={stages} initialState={state} />
      </Section>

      <Section title="Остальные копилоты">
        <p className="mb-4 text-sm text-white/55">
          Агенты Discovery, тактического планирования, операций и мониторинга. Результаты
          публикуются в профильные разделы.
        </p>
        <div className="grid gap-6 lg:grid-cols-2">
          {catalog.map((a) => (
            <AgentPanel
              key={a.id}
              agentId={a.id}
              name={a.name}
              tagline={a.tagline}
              suggestions={a.suggestions}
              greeting={a.greeting}
              requiresMaterials={a.requiresMaterials}
              publishesTo={a.publishesTo}
            />
          ))}
        </div>
      </Section>
    </div>
  );
}
