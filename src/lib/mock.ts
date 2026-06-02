/**
 * Seeded mock data for the prototype. Static and deterministic so the UI
 * is always clickable without a database. Numbers are illustrative.
 */

export type Trend = "up" | "down" | "flat";

/** One point of a plan/fact time series for a metric chart. */
export type SeriesPoint = { period: string; plan: number; fact: number };

export type Metric = {
  id: string;
  name: string;
  value: string;
  delta: string;
  trend: Trend;
  good: boolean; // whether the current trend is good
  spark: number[];
  kind: "product" | "production";
  /** Unit suffix for chart tooltips/axis (e.g. "%", " дн", " млн"). */
  unit?: string;
  /** Plan vs fact over time — drives the expandable chart on the metric card. */
  series?: SeriesPoint[];
};

/** Shared monthly periods for the demo metric series. */
export const METRIC_PERIODS = [
  "Окт 2025",
  "Ноя 2025",
  "Дек 2025",
  "Янв 2026",
  "Фев 2026",
  "Мар 2026",
];

function series(plan: number[], fact: number[]): SeriesPoint[] {
  return METRIC_PERIODS.map((period, i) => ({ period, plan: plan[i], fact: fact[i] }));
}

export type Alert = {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  metric: string;
  time: string;
  kind: "product" | "production";
  note: string;
};

export type Persona = {
  id: string;
  name: string;
  role: string;
  jtbd: string;
  pains: string[];
  share: number;
};

export type Hypothesis = {
  id: string;
  title: string;
  metric: string;
  status: "new" | "in-test" | "validated" | "rejected";
  ice: { impact: number; confidence: number; ease: number };
  source: "agent" | "human";
  /** Agent proposals land in the backlog tagged "proposal" for PO review. */
  tag?: "proposal";
  /** PO decision on a proposal (persisted as feedback for agent calibration). */
  decision?: "validated" | "rejected";
  /** Why a proposal was rejected — feedback the agent learns from. */
  rejectComment?: string;
  /** Lite-prompt fields: certainty level, verify method, data status, source. */
  certainty?: "high" | "medium" | "low";
  verify?: string;
  data?: string;
  sourceRef?: string;
};

export type BacklogItem = {
  id: string;
  title: string;
  type: "feature" | "research" | "tech" | "experiment";
  impact: string;
  effort: "S" | "M" | "L" | "XL";
  okr: string;
  status: "backlog" | "now" | "next" | "later";
};

export type Brief = {
  id: string;
  from: string;
  title: string;
  date: string;
  status: "new" | "processed";
};

export type Roadmap = {
  objective: string;
  keyResults: { text: string; metric: string }[];
};

export const ROLES = ["PO", "CPO", "APO", "Аналитик", "Лид команды"];

export const HEALTH_INDEX = {
  // "ИЗИ" — Индекс Зрелости Инициатив
  value: 78,
  delta: "+6",
  trend: "up" as Trend,
  history: [62, 64, 63, 67, 70, 69, 72, 74, 73, 76, 78],
  breakdown: [
    { label: "Discovery", value: 82 },
    { label: "Tactical", value: 71 },
    { label: "Execution", value: 80 },
    { label: "Метрики", value: 79 },
  ],
};

export const METRICS: Metric[] = [
  {
    id: "m1",
    name: "Конверсия в активацию",
    value: "34.2%",
    delta: "+2.1 п.п.",
    trend: "up",
    good: true,
    spark: [28, 29, 30, 31, 30, 32, 33, 34],
    kind: "product",
    unit: "%",
    series: series([30, 31, 32, 33, 34, 35], [29.5, 30.2, 31.1, 32.4, 33.6, 34.2]),
  },
  {
    id: "m2",
    name: "Retention 9-я неделя",
    value: "41%",
    delta: "-1.4 п.п.",
    trend: "down",
    good: false,
    spark: [45, 44, 44, 43, 43, 42, 42, 41],
    kind: "product",
    unit: "%",
    series: series([45, 45, 45, 44, 44, 44], [45, 44.2, 43.5, 43, 42, 41]),
  },
  {
    id: "m3",
    name: "MAU",
    value: "1.24 млн",
    delta: "+3.8%",
    trend: "up",
    good: true,
    spark: [1.1, 1.12, 1.15, 1.17, 1.18, 1.2, 1.22, 1.24],
    kind: "product",
    unit: " млн",
    series: series([1.12, 1.15, 1.18, 1.2, 1.22, 1.25], [1.1, 1.14, 1.16, 1.19, 1.22, 1.24]),
  },
  {
    id: "m4",
    name: "Time-to-decision",
    value: "2.1 дн",
    delta: "-48%",
    trend: "down",
    good: true,
    spark: [4.2, 4.0, 3.6, 3.2, 2.9, 2.6, 2.3, 2.1],
    kind: "product",
    unit: " дн",
    series: series([4, 3.6, 3.2, 2.8, 2.4, 2], [4.2, 3.7, 3.3, 2.9, 2.4, 2.1]),
  },
  {
    id: "m5",
    name: "Lead Time инициативы",
    value: "18 дн",
    delta: "-57%",
    trend: "down",
    good: true,
    spark: [42, 39, 34, 30, 27, 24, 20, 18],
    kind: "production",
    unit: " дн",
    series: series([40, 34, 29, 25, 21, 18], [42, 36, 31, 27, 22, 18]),
  },
  {
    id: "m6",
    name: "Доля решений с ИИ",
    value: "63%",
    delta: "+11 п.п.",
    trend: "up",
    good: true,
    spark: [40, 44, 48, 51, 55, 58, 60, 63],
    kind: "production",
    unit: "%",
    series: series([45, 49, 53, 56, 60, 64], [44, 48, 52, 55, 58, 63]),
  },
  {
    id: "m7",
    name: "Adoption платформы",
    value: "68%",
    delta: "+5 п.п.",
    trend: "up",
    good: true,
    spark: [50, 53, 56, 58, 60, 63, 66, 68],
    kind: "production",
    unit: "%",
    series: series([52, 56, 60, 64, 68, 72], [50, 55, 59, 63, 66, 68]),
  },
  {
    id: "m8",
    name: "Стоимость дефекта",
    value: "↑ 12%",
    delta: "+12%",
    trend: "up",
    good: false,
    spark: [100, 102, 104, 103, 106, 108, 110, 112],
    kind: "production",
    unit: "%",
    series: series([100, 100, 100, 100, 100, 100], [100, 103, 105, 104, 108, 112]),
  },
];

export const ALERTS: Alert[] = [
  {
    id: "a1",
    severity: "high",
    title: "Retention 9-й недели ниже порога",
    metric: "Retention 9-я неделя",
    time: "2 ч назад",
    kind: "product",
    note: "Падение 3 недели подряд. Похоже на сегмент новых пользователей мобильного приложения.",
  },
  {
    id: "a2",
    severity: "medium",
    title: "Рост стоимости дефекта",
    metric: "Стоимость дефекта",
    time: "5 ч назад",
    kind: "production",
    note: "Стоимость исправления дефекта выросла на 12% за месяц. Проверить процесс ревью.",
  },
  {
    id: "a3",
    severity: "low",
    title: "Аномалия трафика в воронке",
    metric: "Конверсия в активацию",
    time: "1 дн назад",
    kind: "product",
    note: "Кратковременный всплеск отказов на шаге онбординга — возможно, релиз.",
  },
];

export const PERSONAS: Persona[] = [
  {
    id: "p1",
    name: "Коммерсант",
    role: "Владелец категории",
    jtbd: "Быстро доносить идеи до продукта и видеть эффект на выручку категории",
    pains: ["Долго формализовать идею", "Нет прозрачности по статусу", "Сложно связать с метриками"],
    share: 38,
  },
  {
    id: "p2",
    name: "Продакт-менеджер",
    role: "PO продукта",
    jtbd: "Приоритизировать бэклог так, чтобы максимизировать влияние на ключевые метрики",
    pains: ["Много рутины", "Разрозненные данные", "Долгий цикл планирования"],
    share: 34,
  },
  {
    id: "p3",
    name: "Аналитик",
    role: "Product Analyst",
    jtbd: "Быстро получать ответы по метрикам и проверять гипотезы",
    pains: ["Ручной сбор данных", "Долгие ad-hoc запросы", "Контекст разбросан"],
    share: 28,
  },
];

export const HYPOTHESES: Hypothesis[] = [
  {
    id: "h1",
    title: "Упрощённый онбординг в 2 шага повысит активацию",
    metric: "Конверсия в активацию",
    status: "in-test",
    ice: { impact: 8, confidence: 6, ease: 7 },
    source: "agent",
  },
  {
    id: "h2",
    title: "Персонализированные подборки удержат пользователей к 9-й неделе",
    metric: "Retention 9-я неделя",
    status: "new",
    ice: { impact: 9, confidence: 5, ease: 4 },
    source: "agent",
  },
  {
    id: "h3",
    title: "Push о незавершённой корзине вернёт 5% пользователей",
    metric: "MAU",
    status: "validated",
    ice: { impact: 6, confidence: 8, ease: 9 },
    source: "human",
  },
  {
    id: "h4",
    title: "AI-ассистент в карточке ускорит выбор и снизит отказы",
    metric: "Time-to-decision",
    status: "new",
    ice: { impact: 7, confidence: 6, ease: 5 },
    source: "agent",
  },
  // Предложения агента — ждут решения PO (воронка [Предложение]).
  {
    id: "h5",
    title:
      "Если упростить шаги онбординга с 5 до 3, то конверсия в активацию вырастет, потому что 4 из 6 брифов отмечают сложный старт",
    metric: "Конверсия в активацию",
    status: "new",
    ice: { impact: 8, confidence: 6, ease: 6 },
    source: "agent",
    tag: "proposal",
    certainty: "medium",
    verify: "A/B-тест",
    data: "достаточно (метрики из дашборда)",
    sourceRef: "брифы №2,4,5 + дашборд",
  },
  {
    id: "h6",
    title:
      "Если добавить напоминания о незавершённых действиях, то Retention 9-й недели изменится вверх [DATA REQUIRED], потому что в CustDev упоминался отток без касаний",
    metric: "Retention 9-я неделя",
    status: "new",
    ice: { impact: 7, confidence: 4, ease: 7 },
    source: "agent",
    tag: "proposal",
    certainty: "low",
    verify: "CustDev + анализ когорт",
    data: "DATA REQUIRED — нет метрик касаний",
    sourceRef: "CustDev (из диалога)",
  },
];

// Алерты генератора гипотез: на что обратить внимание, что проверить.
export const HYPO_ALERTS = [
  {
    id: "ha1",
    text: "Проблема «сложный онбординг» повторяется в 4 из 6 брифов — сильный сигнал, стоит приоритизировать.",
  },
  {
    id: "ha2",
    text: "По гипотезе про Retention нет метрик касаний — соберите данные, чтобы поднять уверенность.",
  },
];

export const BACKLOG: BacklogItem[] = [
  {
    id: "b1",
    title: "Онбординг в 2 шага",
    type: "experiment",
    impact: "+2-3 п.п. активации",
    effort: "M",
    okr: "O1: Рост активации",
    status: "now",
  },
  {
    id: "b2",
    title: "Персонализированные подборки",
    type: "feature",
    impact: "+1-2 п.п. Retention",
    effort: "L",
    okr: "O2: Удержание",
    status: "next",
  },
  {
    id: "b3",
    title: "AI-ассистент в карточке товара",
    type: "feature",
    impact: "-30% Time-to-decision",
    effort: "XL",
    okr: "O1: Рост активации",
    status: "next",
  },
  {
    id: "b4",
    title: "Исследование оттока на 9-й неделе",
    type: "research",
    impact: "инсайты по Retention",
    effort: "S",
    okr: "O2: Удержание",
    status: "now",
  },
  {
    id: "b5",
    title: "Рефакторинг пайплайна метрик",
    type: "tech",
    impact: "качество данных",
    effort: "M",
    okr: "O3: Data quality",
    status: "later",
  },
];

export const BRIEFS: Brief[] = [
  { id: "br1", from: "Категория «Молочка»", title: "Идея: умные подборки рецептов", date: "сегодня", status: "new" },
  { id: "br2", from: "Маркетинг", title: "Запрос: реактивация спящих", date: "вчера", status: "new" },
  { id: "br3", from: "Категория «Заморозка»", title: "Гипотеза по промо", date: "2 дн назад", status: "processed" },
  { id: "br4", from: "Логистика", title: "Бриф: слоты доставки", date: "3 дн назад", status: "processed" },
];

export const VISION = {
  current: `Стать платформой, где каждая продуктовая роль усилена ИИ: владение AI-инструментами — стандарт профессии PO в X5. ИИ встроен как стандартный слой во все ключевые продуктовые процессы — от сбора идей до приоритизации, документации и авто-анализа метрик.`,
  bets: [
    "AI-компетенции как стандарт для всех продуктовых ролей",
    "Встроенные агенты в каждый этап продукта (Discovery → Execution)",
    "Data Driven & Metrics как единый слой принятия решений",
  ],
  metricsTargets: [
    { name: "Lead Time", target: "-60%" },
    { name: "FTE Stretch", target: "0 найма" },
    { name: "Adoption", target: "70%" },
    { name: "Span of control", target: "1 → 2+" },
    { name: "Time-to-decision", target: "×2" },
  ],
};

// RunRate seed for the monitoring table (used until a copilot publishes one).
// Only plan values are known here; fact/Δ come from Insight later (integration).
export const RUNRATE_SEED = {
  product: "AI Product Ops",
  date: "2026-05-30",
  periods: ["26Q2", "26Q3", "26Q4", "2027", "2028"],
  goals: [
    {
      goal: "O1: Рост активации",
      metrics: [
        { name: "Конверсия в активацию (за мес), %", values: ["35", "37", "39", "43", "48"] },
        { name: "Time-to-decision (за мес), дн", values: ["2.0", "1.8", "1.6", "1.2", "0.9"] },
      ],
    },
    {
      goal: "O2: Удержание",
      metrics: [
        { name: "Retention 9-й недели (за нед), %", values: ["43", "45", "47", "52", "58"] },
        { name: "MAU, млн", values: ["1.26", "1.30", "1.34", "1.50", "1.70"] },
      ],
    },
  ],
};

// Результаты исследований (Discovery). summary — для контекста генератора гипотез.
export const RESEARCH = [
  {
    id: "r1",
    title: "CustDev: онбординг (8 интервью)",
    meta: "PDF · 2 нед назад",
    summary: "5 из 8 жалуются на сложный старт; путаются на шаге 3 из 5; просят меньше полей.",
  },
  {
    id: "r2",
    title: "A/B: подборки на главной",
    meta: "отчёт · 1 мес назад",
    summary: "Персонализированные подборки дали +1.5 п.п. к Retention 9-й недели в тесте.",
  },
];

export const PRESENTATIONS = [
  { id: "pr1", title: "Видение AI Product Ops — Q2", updated: "2 дня назад", slides: 18 },
  { id: "pr2", title: "Стратегия на полугодие", updated: "1 неделю назад", slides: 24 },
  { id: "pr3", title: "Защита бюджета квартала", updated: "3 недели назад", slides: 12 },
];

export const ROADMAP: Roadmap[] = [
  {
    objective: "O1: Ускорить активацию новых пользователей",
    keyResults: [
      { text: "Конверсия в активацию 34% → 40%", metric: "Конверсия в активацию" },
      { text: "Time-to-decision ×2", metric: "Time-to-decision" },
    ],
  },
  {
    objective: "O2: Повысить удержание",
    keyResults: [
      { text: "Retention 9-й недели 41% → 47%", metric: "Retention 9-я неделя" },
      { text: "MAU +10%", metric: "MAU" },
    ],
  },
  {
    objective: "O3: Масштабировать AI в процессах",
    keyResults: [
      { text: "Доля решений с ИИ 63% → 75%", metric: "Доля решений с ИИ" },
      { text: "Adoption платформы 68% → 80%", metric: "Adoption платформы" },
    ],
  },
];

// Settings: connected sources (the "Для ввода / Для вывода" screen)
export const SOURCES = {
  inputs: [
    { id: "s1", name: "Мой Confluence", desc: "Пространство продукта", connected: true },
    { id: "s2", name: "Моя доска (Jira)", desc: "Проект и бэклог", connected: true },
    { id: "s3", name: "Мои API (на Copilot)", desc: "X5 Copilot эндпоинт", connected: false },
    { id: "s4", name: "Ссылка на ТР", desc: "Технические требования", connected: true },
  ],
  outputs: [
    { id: "o1", name: "Мой Confluence", desc: "Куда публиковать артефакты", connected: true },
    { id: "o2", name: "Моя доска (Jira)", desc: "Куда заводить задачи", connected: true },
    { id: "o3", name: "Дайджесты", desc: "Email / мессенджер", connected: false },
    { id: "o4", name: "Ссылка на ТР", desc: "Экспорт в ТР", connected: true },
  ],
};
