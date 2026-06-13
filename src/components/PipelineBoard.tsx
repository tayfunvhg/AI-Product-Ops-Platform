"use client";

import { useCallback, useState } from "react";
import AgentPanel from "./AgentPanel";
import type { ArtifactType } from "@/lib/artifacts";

type AgentBrief = {
  id: string;
  name: string;
  tagline: string;
  status: string | null;
  suggestions: string[];
  greeting: string | null;
  requiresMaterials: boolean;
  publishesTo: ArtifactType | null;
} | null;

type Stage = { id: string; n: number; title: string; gen: AgentBrief; eval: AgentBrief };
type Status = "locked" | "open" | "generated" | "validated";

// Готовность агента — текстовый чип. ВАЖНО: не эмодзи-светофор: 🟢🟡🔴
// зарезервированы за оценкой качества у Evaluator (вывод модели в чате), и
// переиспользование цвета для готовности порождало семантический конфликт.
const STATUS_CHIP: Record<string, string> = {
  prod: "Прод",
  pilot: "Пилот",
  candidate: "Кандидат",
  target: "Целевая",
};

export default function PipelineBoard({
  stages,
  initialState,
}: {
  stages: Stage[];
  initialState: Record<string, Status>;
}) {
  const [state, setState] = useState<Record<string, Status>>(initialState);
  // Which block has its chat open: "stageId:role"
  const [openChat, setOpenChat] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  // Track which eval agents have replied at least once (stageId set).
  const [evalReplied, setEvalReplied] = useState<Set<string>>(new Set());

  const chatKey = (stageId: string, role: "gen" | "eval") => `${stageId}:${role}`;

  const toggleChat = useCallback(
    (stageId: string, role: "gen" | "eval") => {
      const k = chatKey(stageId, role);
      setOpenChat((prev) => (prev === k ? null : k));
    },
    []
  );

  const markEvalReplied = useCallback((stageId: string) => {
    setEvalReplied((prev) => {
      const next = new Set(prev);
      next.add(stageId);
      return next;
    });
  }, []);

  async function act(stageId: string, action: "generated" | "validated" | "reset") {
    setBusy(true);
    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: stageId, action }),
      });
      const d = await res.json();
      if (d?.ok) {
        setState(d.state);
        // Авто-переход: после валидации открываем чат генератора следующего этапа.
        if (action === "validated") {
          const idx = stages.findIndex((s) => s.id === stageId);
          const next = stages[idx + 1];
          if (next && d.state[next.id] === "open") {
            setOpenChat(chatKey(next.id, "gen"));
            setToast(`✓ Этап «${stages[idx].title}» пройден → перешли к «${next.title}»`);
          } else {
            setOpenChat(null);
            setToast(`✓ Этап «${stages[idx].title}» пройден — конвейер завершён 🎉`);
          }
          setTimeout(() => setToast(null), 4500);
        }
        // При reset — сбросим отметку эватора
        if (action === "reset") {
          setEvalReplied((prev) => {
            const next = new Set(prev);
            next.delete(stageId);
            return next;
          });
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className="rounded-2xl border border-brand-300/40 bg-brand-300/15 px-4 py-3 text-sm text-brand-100">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="text-sm font-semibold uppercase tracking-wide text-brand-300">Запуск продукта</div>
        <div className="hidden text-sm font-semibold uppercase tracking-wide text-brand-300 md:block">
          Валидация продукта
        </div>
      </div>

      {stages.map((stage) => (
        <StageRow
          key={stage.id}
          stage={stage}
          status={state[stage.id] ?? "locked"}
          openChat={openChat}
          toggleChat={toggleChat}
          act={act}
          busy={busy}
          evalReplied={evalReplied.has(stage.id)}
          onEvalReply={() => markEvalReplied(stage.id)}
        />
      ))}
    </div>
  );
}

/* ────────────── StageRow: a row with gen + eval blocks ────────────── */

function StageRow({
  stage,
  status,
  openChat,
  toggleChat,
  act,
  busy,
  evalReplied,
  onEvalReply,
}: {
  stage: Stage;
  status: Status;
  openChat: string | null;
  toggleChat: (stageId: string, role: "gen" | "eval") => void;
  act: (stageId: string, action: "generated" | "validated" | "reset") => void;
  busy: boolean;
  evalReplied: boolean;
  onEvalReply: () => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex w-8 shrink-0 pt-4">
        <span
          className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${
            status === "validated"
              ? "bg-brand-500 text-ink-900"
              : status === "locked"
              ? "bg-white/10 text-white/40"
              : "bg-brand-500/30 text-brand-100"
          }`}
        >
          {stage.n}
        </span>
      </div>
      <div className={`grid flex-1 gap-3 ${stage.eval ? "md:grid-cols-2" : "grid-cols-1"}`}>
        <BlockCard
          stage={stage}
          role="gen"
          status={status}
          openChat={openChat}
          toggleChat={toggleChat}
          act={act}
          busy={busy}
          canValidate={false}
        />
        {stage.eval && (
          <BlockCard
            stage={stage}
            role="eval"
            status={status}
            openChat={openChat}
            toggleChat={toggleChat}
            act={act}
            busy={busy}
            canValidate={evalReplied}
            onAgentReply={onEvalReply}
          />
        )}
      </div>
    </div>
  );
}

/* ────────────── BlockCard: one gen or eval block ────────────── */

function BlockCard({
  stage,
  role,
  status,
  openChat,
  toggleChat,
  act,
  busy,
  canValidate,
  onAgentReply,
}: {
  stage: Stage;
  role: "gen" | "eval";
  status: Status;
  openChat: string | null;
  toggleChat: (stageId: string, role: "gen" | "eval") => void;
  act: (stageId: string, action: "generated" | "validated" | "reset") => void;
  busy: boolean;
  /** For eval blocks: true when the evaluator has given at least one reply. */
  canValidate: boolean;
  onAgentReply?: () => void;
}) {
  const agent = role === "gen" ? stage.gen : stage.eval;
  if (!agent) return <div />;

  const locked = role === "gen" ? status === "locked" : status === "locked" || status === "open";
  const chatK = `${stage.id}:${role}`;
  const isChatOpen = openChat === chatK;
  const validated = status === "validated";

  const ring = isChatOpen
    ? "ring-1 ring-brand-300/60 border-brand-300/60"
    : validated && role === "eval"
    ? "border-brand-300/40"
    : "border-white/10";

  return (
    <div className={`rounded-2xl border bg-ink-800/40 p-4 ${ring} ${locked ? "opacity-45" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-white">
          {role === "gen"
            ? stage.n === 0
              ? stage.title
              : `Сформировать: ${stage.title.toLowerCase()}`
            : `Провалидировать: ${stage.title.toLowerCase()}`}
        </div>
        {agent.status && STATUS_CHIP[agent.status] && (
          <span className="chip border-white/10 bg-white/5 text-[11px] text-white/55">
            {STATUS_CHIP[agent.status]}
          </span>
        )}
      </div>
      <div className="mt-1 text-xs text-white/45">{agent.name}</div>

      {locked ? (
        <div className="mt-3 text-xs text-white/40">🔒 откроется после валидации предыдущего</div>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={() => toggleChat(stage.id, role)}
              className="btn-ghost text-xs"
            >
              {isChatOpen ? "Скрыть чат" : "💬 Открыть чат"}
            </button>

            {/* Действия гейтинга */}
            {role === "gen" && stage.n === 0 && !validated && (
              <button
                onClick={() => act(stage.id, "validated")}
                disabled={busy}
                className="btn-primary text-xs disabled:opacity-50"
              >
                ✓ Готово
              </button>
            )}
            {role === "gen" && stage.n !== 0 && status === "open" && (
              <button
                onClick={() => act(stage.id, "generated")}
                disabled={busy}
                className="btn-primary text-xs disabled:opacity-50"
              >
                ✓ Артефакт готов
              </button>
            )}
            {role === "eval" && status === "generated" && (
              <button
                onClick={() => act(stage.id, "validated")}
                disabled={busy || !canValidate}
                title={!canValidate ? "Сначала получите оценку от эватора (отправьте сообщение)" : ""}
                className="btn-primary text-xs disabled:opacity-50"
              >
                ✓ Валидация пройдена
              </button>
            )}
            {validated && (
              <>
                <span className="chip border-brand-300/30 bg-brand-300/10 text-brand-100">✓ пройдено</span>
                {role === (stage.eval ? "eval" : "gen") && (
                  <button
                    onClick={() => act(stage.id, "reset")}
                    disabled={busy}
                    className="text-xs text-white/40 hover:text-rose-300"
                  >
                    ↺ доработать
                  </button>
                )}
              </>
            )}
          </div>

          {/* Инлайн-чат — встроен прямо в блок, не под конвейером */}
          {isChatOpen && (
            <div className="mt-4 border-t border-white/5 pt-4">
              <AgentPanel
                key={chatK}
                agentId={agent.id}
                name={agent.name}
                tagline={agent.tagline}
                suggestions={agent.suggestions}
                greeting={agent.greeting ?? undefined}
                requiresMaterials={agent.requiresMaterials}
                publishesTo={agent.publishesTo ?? undefined}
                onAgentReply={onAgentReply}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
