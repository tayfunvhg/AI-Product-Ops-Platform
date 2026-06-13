/**
 * Этапы конвейера ИИ-менеджера: «Запуск продукта → Валидация продукта».
 *
 * Жёсткий гейтинг: следующий этап открывается только после успешной валидации
 * текущего. Каждый этап (кроме классификации) — пара «генератор + эватор».
 */
export type PipelineStage = {
  id: string;
  n: number;
  title: string;
  genAgent: string; // id агента-генератора
  evalAgent?: string; // id агента-эватора (нет у классификации)
};

export const PIPELINE: PipelineStage[] = [
  { id: "classify", n: 0, title: "Классификация инициативы", genAgent: "initiative-classifier" },
  { id: "vision", n: 1, title: "Продуктовое видение", genAgent: "vision-updater", evalAgent: "vision-evaluator" },
  { id: "strategy", n: 2, title: "Стратегия", genAgent: "strategy-actualizer", evalAgent: "strategy-evaluator" },
  { id: "goals", n: 3, title: "Цели", genAgent: "goal-generator", evalAgent: "goal-evaluator" },
  { id: "metrics", n: 4, title: "Метрики", genAgent: "metric-generator", evalAgent: "metric-validator" },
];

export type StageStatus = "locked" | "open" | "generated" | "validated";
