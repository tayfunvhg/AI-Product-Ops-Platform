# Полный план изменений приложения с учётом всех агентов

Версия: 0.2 · Дата: 2026-05-31 · Статус: план (реализация поэтапно, по сигналу PO)

Сводит 5 групп концепций + сквозные сервисы в конкретный план изменений по
каждому разделу приложения и по каждому агенту. Исходники — `docs/concepts/`
(Vision&Strategy v0.3, Discovery v0.5, Metrics v0.5, Tactical v0.5, Execution v0.4,
Master Map v0.2). Статусы: 🟢 Прод · 🟡 Пилот · 🟠 Кандидат · 🔵 Целевая.

Легенда готовности в приложении: ✅ сделано · ◐ частично · ⬜ запланировано.

---

## A. Сквозной фундамент (нужен почти всем агентам)

1. **Типы артефактов — расширить.** Есть: vision, runrate/metrics, hypotheses,
   personas. Добавить: `strategy`, `goals`, `okr`, `prd`, `brief`,
   `opportunity-tree`, `ab-design`, `research-insights`. Для каждого — парсер
   (parsers.ts) + раздел-потребитель + публикация draft→published (механизм ✅).
2. **Эваторы со структурированным вердиктом** (Ok/Частично/Не проходит + балл +
   рекомендация) → сохранять в данные → **автогейтинг конвейера** (опция к ручному). ⬜
3. **Метка уровня валидации** на Discovery-артефактах (Гипотеза/Частично/
   Подтверждено + источник) — поле + бейдж. ⬜
4. **Реестр агентов**: промты в `src/prompts/*` по мере готовности; статусы-бейджи ✅;
   пары генератор↔эватор. ◐
5. **Проактивный слой** (🔵): планировщик/очередь для агентов по расписанию/триггеру. ⬜
6. **Интеграции / MCP** (этап F из ARCHITECTURE.md): Трекер (Kaiten/Я.Трекер),
   Confluence, Insight (продуктовые метрики), Qlik (производственные). Сейчас заглушки. ◐
7. **База знаний (RAG) + Knowledge Search** — индексация материалов, сквозной поиск. ⬜
8. **Выбор продукта** (если продуктов несколько) — конвейер и артефакты на продукт. ⬜ (открытый вопрос)

---

## B. План по разделам приложения

### Главная
- **Digest Agent** 🟠 — расширить блок «Дайджест» до агрегатора (рынок/метрики/
  стратегия/процессы) с переходами. ⬜
- ИЗИ ✅ — оставить, в целевой питать сигналами. Рекомендации ✅ — из дайджеста/алертов.

### ИИ-менеджер (хаб) — ядро
- **Конвейер «Запуск → Валидация»** ✅: классификация → видение → стратегия → цели →
  метрики; пара генератор+эватор; жёсткий гейтинг; чат по клику.
- Доработки: **автогейтинг по вердикту эватора** ⬜; полные промты этапов ⬜;
  публикация артефактов `strategy`/`goals` в разделы ⬜.
- **Каталог ниже** ✅ — остальные агенты; сгруппировать по группам с бейджами и
  кнопками запуска. ◐

### Видение и стратегия
- **Vision Writer** 🟡 ✅ + **Vision Evaluator** 🟢 (этап конвейера ✅).
- **Strategy Actualizer/Evaluator** 🟠 — блок «Стратегия» (диагноз → фокус → шаги по
  годам с ориентирами); артефакт `strategy`. ◐ (агенты есть, артефакт/раздел ⬜)
- **Strategy Alignment Monitor** 🟠→🔵 — виджет «согласованность/дрейф» (вход:
  метрики + бэклог + стратегия). ⬜
- **Trend Watcher** 🟢 — лента трендов как вход видения/гипотез. ⬜ (внешний продукт)

### Discovery
- **Hypothesis Generator** 🟡 ✅ (+ комплексный контекст ✅); проактивный режим 🔵 ⬜.
- **Persona Generator + Persona Evaluator** 🟠 — структурные персоны (парсер ◐),
  метка валидации ⬜, редактирование цели ✅.
- **Interview Prep / Interview Analyzer** 🟠 + **Insight&PoV / Interview Guide
  Evaluator** 🟠 — подраздел «Исследования»: бриф+выборка+гайд; анализ интервью →
  инсайты / точка зрения / «как мы можем». ⬜
- **Opportunity Mapper** 🟠 — дерево возможностей (новый компонент-визуализация). ⬜
- **Hypothesis Validator** 🟠 — на карточке гипотезы «выбрать метод проверки» →
  маршрут: A/B → Metrics, прототип → Prototype Designer, опрос → Quant Survey. ⬜
- **Quant Survey / Prototype & Test Designer** 🟠 — артефакты исследований «на руки». ⬜
- **Initiative Classifier** 🟡 — этап 0 конвейера ✅ + бейдж классификации на инициативе ⬜.
- Воронка [Предложение] → Валидировано/Отклонено+коммент ✅.

### Tactical Planning
- **Quarterly OKR Generator + OKR Evaluator** 🟠 — заменить статичный черновик OKR
  на агентную генерацию + оценку; артефакт `okr`. ⬜
- **Backlog Prioritizer** 🟠 — приоритизация бэклога (RICE по умолч. + WSJF/ICE/своя),
  связка задача↔гипотеза↔метрика, подсветка без связи и дублей. ◐ (ICE есть в Discovery)
- **Risk & Mitigation Analyzer** 🔵 — виджет рисков квартального плана. ⬜

### Execution
- **Brief Writer** 🟡 — чат брифа; бриф → бэклог Discovery (с проверкой дублей). ⬜
- **PRD Writer + PRD Evaluator** 🟡/🟠 — генерация и оценка PRD; артефакт `prd`. ⬜
- **Task Decomposer + Task Estimator** 🟠 — декомпозиция и оценка (калибровка по
  Delivery-метрикам в целевой). ⬜
- **Duplicate Finder** 🟠 — дубли требований/задач. ⬜
- **Scriber** 🟢 + **Meeting Output Processor** 🟠 — саммари встреч → задачи / action
  items / темы. ⬜
- **Presentation Generator** 🟠 — сквозная кнопка «вынести в презентацию» из любого
  артефакта. ⬜
- **Status Report Agent** 🟠→🔵 — статус-отчёты для комитетов. ⬜
- **Delivery Analytics Agent** 🟠→🔵 — производственные метрики (Qlik/Insight) →
  раздел Мониторинг (производственные). ◐ (плашки/графики есть, данные — сиды)
- **Knowledge Search Agent** 🟠 — сквозной поиск по базе знаний. ⬜
- Синхронизация с Трекером ✅ (заглушка) → реальная MCP ⬜.

### Мониторинг
- **Anomaly & Action Agent** 🔵 — реалтайм-алерты, аномалии, прогноз, рекомендации
  (сейчас алерты — сиды); RunRate план/факт из Insight. ◐
- **Delivery Analytics** 🔵 — производственные по **целевым зонам/порогам** (T2M,
  Lead Time, Flow Efficiency), а не RunRate — добавить пороговую оценку. ⬜
- **Metric Quality / Metric–Goal / Effect&Decision Validator** 🟠 — разнести текущий
  единый «Валидатор метрик» на 3 фильтра со светофором. ◐
- **A/B Analyzer** 🔵, **Digest/Retro Agent** 🔵, **Metric Data Readiness Checker** 🔵 — целевая. ⬜
- Алерты → выход агентов-мониторов ✅ (рамка готова).

### Настройки
- Выбор модели ✅. Подключение интеграций (Трекер/Confluence/Insight/Qlik) — статусы
  коннекторов (макет SOURCES ✅) → реальные ⬜. База знаний (RAG) ⬜.

---

## C. Полный мэппинг агентов

| Группа | Агент | Статус | Поверхность / изменение | Готовность |
|---|---|---|---|---|
| Vision | Vision Writer | 🟡 | конвейер: видение-ген; раздел Видение | ✅ |
| Vision | Vision Evaluator | 🟢 | конвейер: видение-валид | ✅ (старт-промт) |
| Vision | Strategy Actualizer | 🟠 | конвейер: стратегия-ген; артефакт strategy | ◐ |
| Vision | Strategy Evaluator | 🟠 | конвейер: стратегия-валид | ◐ |
| Vision | Strategy Alignment Monitor | 🟠→🔵 | виджет дрейфа в Видении | ⬜ |
| Vision | Digest Agent | 🟠→🔵 | дайджест на Главной | ⬜ |
| Vision | Trend Watcher | 🟢 | лента трендов | ⬜ |
| Discovery | Initiative Classifier | 🟡 | конвейер: этап 0 | ✅ (старт-промт) |
| Discovery | Hypothesis Generator | 🟡 | Discovery: бэклог/воронка | ✅ |
| Discovery | Persona Generator | 🟠 | Discovery: персоны | ◐ |
| Discovery | Persona Evaluator | 🟠 | Discovery: оценка персоны | ⬜ |
| Discovery | Interview Prep | 🟠 | Discovery: исследования | ⬜ |
| Discovery | Interview Analyzer | 🟠 | Discovery: исследования | ⬜ |
| Discovery | Opportunity Mapper | 🟠 | Discovery: дерево возможностей | ⬜ |
| Discovery | Hypothesis Validator | 🟠 | Discovery: метод проверки на карточке | ⬜ |
| Discovery | Quant Survey Designer | 🟠 | Discovery: исследования | ⬜ |
| Discovery | Prototype & Test Designer | 🟠 | Discovery: исследования | ⬜ |
| Discovery | Interview Guide / Insight&PoV Evaluator | 🟠 | Discovery: эваторы | ⬜ |
| Metrics | Goal Generator | 🟡 | конвейер: цели-ген | ✅ (старт-промт) |
| Metrics | Goal Evaluator | 🟠 | конвейер: цели-валид | ◐ (старт-промт) |
| Metrics | Metric Generator | 🟡 | конвейер: метрики-ген; RunRate→Мониторинг | ✅ |
| Metrics | Metric Quality Validator | 🟠 | Мониторинг: фильтр 1 | ◐ |
| Metrics | Metric–Goal Validator | 🟠 | Мониторинг: фильтр 2 | ◐ |
| Metrics | Effect & Decision Validator | 🟠 | Мониторинг: фильтр 3 | ◐ |
| Metrics | A/B Test Designer | 🟠 | артефакт ab-design (маршрут из Discovery) | ⬜ |
| Metrics | Anomaly & Action Agent | 🔵 | Мониторинг: алерты/прогноз | ⬜ |
| Metrics | A/B Analyzer | 🔵 | Мониторинг: результаты экспериментов | ⬜ |
| Metrics | Digest / Retro Agent | 🔵 | Мониторинг: ретро | ⬜ |
| Metrics | Metric Data Readiness Checker | 🔵 | проверка собираемости метрики | ⬜ |
| Tactical | Quarterly OKR Generator | 🟠 | Tactical: OKR-ген | ⬜ |
| Tactical | OKR Evaluator | 🟠 | Tactical: OKR-валид | ⬜ |
| Tactical | Backlog Prioritizer | 🟠 | Tactical/Discovery: приоритизация | ◐ |
| Tactical | Risk & Mitigation Analyzer | 🔵 | Tactical: риски | ⬜ |
| Execution | Brief Writer | 🟡 | Execution/Discovery: брифы | ⬜ |
| Execution | Scriber | 🟢 | Execution: саммари встреч | ⬜ |
| Execution | PRD Writer | 🟡 | Execution: PRD-ген | ⬜ |
| Execution | PRD Evaluator | 🟠 | Execution: PRD-валид | ⬜ |
| Execution | Task Decomposer | 🟠 | Execution: задачи | ⬜ |
| Execution | Task Estimator | 🟠 | Execution: оценка | ⬜ |
| Execution | Duplicate Finder | 🟠 | Execution: дубли | ⬜ |
| Execution | Meeting Output Processor | 🟠 | Execution: разбор встреч | ⬜ |
| Execution | Presentation Generator | 🟠 | сквозная кнопка «в презентацию» | ⬜ |
| Execution | Status Report Agent | 🟠→🔵 | Execution: статус-отчёты | ⬜ |
| Execution | Knowledge Search Agent | 🟠 | сквозной поиск (RAG) | ⬜ |
| Execution | Delivery Analytics Agent | 🟠→🔵 | Мониторинг: производственные | ◐ |

---

## D. Поэтапный план реализации

- **Итерация A — закрепить конвейер.** Полные промты этапов (Strategy/Goal/эваторы/
  классификатор); структурированные вердикты эваторов → автогейтинг; артефакты
  `strategy`/`goals` + отображение в разделах.
- **Итерация B — Discovery вглубь.** Persona Gen+Eval (структурный парсер),
  Interview Prep/Analyzer, Hypothesis Validator (маршрут метода), метка валидации,
  Opportunity Mapper.
- **Итерация C — Tactical.** OKR Generator+Evaluator, Backlog Prioritizer
  (RICE+сменные), связки задача↔гипотеза↔метрика.
- **Итерация D — Execution.** PRD Writer+Evaluator, Task Decomposer/Estimator,
  Duplicate Finder, Meeting Output Processor, Presentation/Status агенты.
- **Итерация E — сквозное.** RAG + Knowledge Search; Digest как агрегатор;
  3 валидатора метрик со светофором.
- **Итерация F — целевая инфраструктура.** MCP (Трекер/Confluence/Insight/Qlik),
  проактивные режимы, реалтайм-мониторинг (Anomaly&Action, Delivery Analytics),
  A/B Analyzer, консолидация Monitoring & Alert, выделение группы Data.

---

## E. Открытые вопросы к PO

1. **Автогейтинг** по вердикту эватора (Ok) — авто или всегда ручное подтверждение?
2. **Цели** и **стратегия** — отдельные разделы или блоки внутри Видения/Мониторinga?
3. **Один продукт или несколько** — нужен ли выбор продукта (конвейер на продукт)?
4. Очередь приоритетов проактивных агентов (гипотезы / аномалии / дайджест)?
5. Когда заливать полные промты этапных агентов (сейчас стартовые версии)?
