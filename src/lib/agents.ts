/**
 * Agent registry. Each agent is a thin LLM persona over X5 Copilot.
 * Prompts are intentionally editable — this is a prototype, not a contract.
 *
 * The platform principle (deck slide 5): the human always owns the decision.
 * Agents propose artifacts; they never silently mutate state.
 *
 * Server-only module (reads prompt files from disk and mock data).
 */
import fs from "node:fs";
import path from "node:path";
import { VISION, ROADMAP, METRICS } from "./mock";

export type AgentModule =
  | "vision"
  | "discovery"
  | "tactical"
  | "execution"
  | "monitoring";

export type AgentDef = {
  id: string;
  name: string;
  module: AgentModule;
  tagline: string;
  systemPrompt: string;
  suggestions: string[];
  /** Optional first assistant message shown in the UI (and used as context). */
  greeting?: string;
  /** Render this agent as a large, featured panel. */
  featured?: boolean;
};

/** Read a prompt file from src/prompts. Returns "" if missing. */
function loadPrompt(file: string): string {
  try {
    return fs.readFileSync(path.join(process.cwd(), "src", "prompts", file), "utf8");
  } catch {
    return "";
  }
}

/**
 * Live platform context injected into the Metric Generator so it can work in
 * "Режим 1 (с целями)" against this product's actual vision, goals and metrics.
 */
function platformContextForMetrics(): string {
  const today = new Date().toISOString().slice(0, 10);
  const goals = ROADMAP.map((o, i) => {
    const krs = o.keyResults.map((k) => `   - ${k.text} (метрика: ${k.metric})`).join("\n");
    return `${i + 1}. ${o.objective}\n${krs}`;
  }).join("\n");
  const existing = METRICS.map((m) => `- ${m.name}: ${m.value} (${m.delta})`).join("\n");

  return [
    "\n\n---\n\n## КОНТЕКСТ ПЛАТФОРМЫ (материалы для работы)\n",
    `Сегодняшняя дата: ${today}. Продукт: «AI Product Ops» (платформа продуктового управления с ИИ в X5).`,
    `\n### Видение продукта\n${VISION.current}`,
    `\n### Стратегические ставки\n${VISION.bets.map((b) => `- ${b}`).join("\n")}`,
    `\n### Цели/OKR (используй как «цели PO» для Режима 1)\n${goals}`,
    `\n### Уже отслеживаемые метрики (для проверки пересечений)\n${existing}`,
    "\nИспользуй эти материалы как первичные. Если чего-то не хватает — уточняй у PO, не выдумывай.",
  ].join("\n");
}

const BASE_POLICY = `Ты — ИИ-агент платформы AI Product Ops в X5. Отвечай по-русски, кратко и по делу, в духе продуктового менеджмента. Привязывай предложения к метрикам и стратегии продукта. Решение всегда принимает человек (PO/CPO) — ты только предлагаешь артефакты и не утверждаешь, что что-то уже изменено.`;

export const AGENTS: AgentDef[] = [
  {
    id: "metric-generator",
    name: "Генератор метрик",
    module: "monitoring",
    tagline:
      "Помогает сформировать качественные продуктовые метрики через диалог (на основе видения и целей)",
    featured: true,
    greeting:
      "Привет! Помогу сформировать метрики продукта — регулярные индикаторы верного движения. Я уже вижу видение, цели/OKR и текущие метрики этого продукта. Можем разобрать цели по очереди и подобрать к ним метрики, доработать существующие или построить RunRate (плановые значения). С чего начнём?",
    systemPrompt: loadPrompt("metric-generator.md") + platformContextForMetrics(),
    suggestions: [
      "Разбери мои цели и предложи метрики",
      "Проверь качество текущих метрик",
      "Построим RunRate по ключевым метрикам",
    ],
  },
  {
    id: "vision-updater",
    name: "Агент обновления видения",
    module: "vision",
    tagline: "Актуализирует видение продукта по новым данным и метрикам",
    systemPrompt: `${BASE_POLICY}\nТвоя зона — Vision & Strategy. Помогаешь переформулировать видение, цели и стратегические ставки. Предлагай изменения как дифф: что добавить/убрать/переформулировать и почему.`,
    suggestions: [
      "Обнови видение с учётом роста доли AI-решений до 70%",
      "Сформулируй 3 стратегические ставки на следующий квартал",
      "Какие риски в текущем видении?",
    ],
  },
  {
    id: "hypothesis-agent",
    name: "Агент гипотез",
    module: "discovery",
    tagline: "Предлагает и приоритизирует продуктовые гипотезы (авто/по запросу)",
    systemPrompt: `${BASE_POLICY}\nТвоя зона — Discovery. На основе проблем, болей пользователей и метрик предлагай гипотезы в формате: гипотеза → ожидаемый эффект на метрику → как проверить (эксперимент) → оценка усилий.`,
    suggestions: [
      "Предложи 5 гипотез для роста удержания на 9 неделе",
      "Сформулируй гипотезу под проблему долгого онбординга",
      "Приоритизируй гипотезы по ICE",
    ],
  },
  {
    id: "persona-agent",
    name: "Агент по персонам",
    module: "discovery",
    tagline: "Работает с персонами: уточняет JTBD, боли, сценарии",
    systemPrompt: `${BASE_POLICY}\nТвоя зона — работа с персонами. Помогай уточнять JTBD, боли, барьеры и сценарии использования. Связывай инсайты по персонам с гипотезами.`,
    suggestions: [
      "Опиши JTBD для персоны «Коммерсант»",
      "Какие боли у персоны мешают активации?",
      "Сопоставь персоны с топ-гипотезами",
    ],
  },
  {
    id: "planning-agent",
    name: "Агент тактического планирования",
    module: "tactical",
    tagline: "Готовит к кв. планированию: анализ бэклога и черновик OKR",
    systemPrompt: `${BASE_POLICY}\nТвоя зона — Tactical Planning. Анализируй бэклог (артефакты, оценки влияния на метрики, эффекты, бюджет квартала) и предлагай черновик OKR с учётом стратегии. Возвращай: Objective → 2-3 Key Results с метриками → связанные инициативы.`,
    suggestions: [
      "Собери черновик OKR на квартал из текущего бэклога",
      "Какие инициативы дают максимум к Lead Time?",
      "Сформируй план квартального планирования",
    ],
  },
  {
    id: "execution-agent",
    name: "Агент исполнения",
    module: "execution",
    tagline: "Помогает с рутиной: статусы, протоколы, синхронизация трекера",
    systemPrompt: `${BASE_POLICY}\nТвоя зона — Execution. Помогай с рутинными задачами: краткие статусы, протоколы встреч, риски доставки, формулировки задач для трекера.`,
    suggestions: [
      "Сделай статус по инициативе для стейкхолдеров",
      "Сформулируй задачу для трекера из гипотезы",
      "Какие риски доставки сейчас высокие?",
    ],
  },
  {
    id: "monitoring-agent",
    name: "Цифровой агент по мониторингу",
    module: "monitoring",
    tagline: "Следит за продуктовыми и производственными метриками, объясняет алерты",
    systemPrompt: `${BASE_POLICY}\nТвоя зона — Monitoring & Alert. Объясняй причины алертов по метрикам (продукт/производство), предлагай гипотезы о причинах и следующие шаги. Различай продуктовые и производственные метрики.`,
    suggestions: [
      "Почему упала конверсия в активацию на этой неделе?",
      "Объясни алерт по производственной метрике",
      "Что проверить в первую очередь по падению Retention?",
    ],
  },
];

export function getAgent(id: string): AgentDef | undefined {
  return AGENTS.find((a) => a.id === id);
}

export function agentsForModule(module: AgentModule): AgentDef[] {
  return AGENTS.filter((a) => a.module === module);
}
