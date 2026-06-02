import { PageHeader, Section } from "@/components/ui";
import X5ConnectionTest from "@/components/X5ConnectionTest";
import ModelSelector from "@/components/ModelSelector";
import { SOURCES } from "@/lib/mock";

type Source = { id: string; name: string; desc: string; connected: boolean };

function SourceList({ title, items }: { title: string; items: Source[] }) {
  return (
    <div>
      <div className="mb-2 text-xs text-white/40">{title}</div>
      <div className="space-y-3">
        {items.map((s) => (
          <div key={s.id} className="card flex items-center justify-between gap-3">
            <div>
              <div className="font-medium text-white">{s.name}</div>
              <div className="text-xs text-white/45">{s.desc}</div>
            </div>
            <span
              className={`chip shrink-0 ${
                s.connected
                  ? "border-brand-300/30 bg-brand-300/10 text-brand-100"
                  : "border-white/10"
              }`}
            >
              {s.connected ? "● подключено" : "○ не подключено"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Настройки"
        subtitle="Источники для ввода и вывода артефактов, а также подключение LLM для агентов."
      />

      <Section title="Выбор ИИ-модели">
        <ModelSelector />
      </Section>

      <Section title="Подключение LLM">
        <X5ConnectionTest />
      </Section>

      <Section title="Источники данных">
        <div className="grid gap-6 lg:grid-cols-2">
          <SourceList title="Для ввода" items={SOURCES.inputs} />
          <SourceList title="Для вывода" items={SOURCES.outputs} />
        </div>
      </Section>
    </div>
  );
}
