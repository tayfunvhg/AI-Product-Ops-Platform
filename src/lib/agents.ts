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
import type { ArtifactType } from "./artifacts";

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
  /**
   * Agent only acts on user-supplied materials. The UI disables suggestion
   * chips until at least one file is attached (free-text chat still works).
   */
  requiresMaterials?: boolean;
  /**
   * If set, the agent is a "copilot" that produces an artifact publishable into
   * the given section (enables the "Опубликовать в раздел" action in the hub).
   */
  publishesTo?: ArtifactType;
};

/** Read a prompt file from src/prompts. Returns "" if missing. */
function loadPrompt(file: string): string {
  try {
    return fs.readFileSync(path.join(process.cwd(), "src", "prompts", file), "utf8");
  } catch {
    return "";
  }
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
    requiresMaterials: true,
    publishesTo: "runrate",
    greeting:
      "Привет! Помогу сформировать метрики продукта — регулярные индикаторы верного движения. Приложите материалы (📎 видение, цели/OKR, описание продукта или презентацию) — и разберём цели и метрики по ним. Если метрик ещё нет, можем просто начать разговор.",
    systemPrompt: loadPrompt("metric-generator.md"),
    suggestions: [
      "Разбери мои цели и предложи метрики",
      "Построим RunRate по ключевым метрикам",
    ],
  },
  {
    id: "vision-updater",
    name: "Vision Writer",
    module: "vision",
    tagline: "Собирает продуктовое видение через диалог: куда идём, для кого, какая ценность",
    publishesTo: "vision",
    greeting:
      "Привет! Помогу собрать продуктовое видение — куда идём, для кого и какую ценность создаём. Можно начать с нуля (расскажите про продукт), с материалами (📎 пришлите описание, презентации, метрики) или доработать текущее видение.",
    systemPrompt: loadPrompt("vision-writer.md"),
    suggestions: [
      "Соберём видение с нуля — расскажу про продукт",
      "Вот материалы — проанализируй и спроси по пробелам",
      "Доработай текущее видение",
    ],
  },
  {
    id: "hypothesis-agent",
    name: "Агент гипотез",
    module: "discovery",
    tagline: "Предлагает и приоритизирует продуктовые гипотезы (авто/по запросу)",
    publishesTo: "hypotheses",
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
    publishesTo: "personas",
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
