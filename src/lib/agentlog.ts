/**
 * Lightweight, local-only debug log for agent turns. Appends one JSON line per
 * request to `agent-debug.log` in the project root (gitignored) so we can
 * inspect what was actually sent to the model and what came back — the chat
 * UI keeps no server-side history otherwise.
 *
 * Server-only. Failures are swallowed: logging must never break a request.
 */
import fs from "node:fs";
import path from "node:path";

const LOG_PATH = path.join(process.cwd(), "agent-debug.log");
const MAX_FIELD = 4000; // truncate long contents (e.g. attached materials)

function trunc(s: string): string {
  return s.length > MAX_FIELD ? `${s.slice(0, MAX_FIELD)}…[+${s.length - MAX_FIELD} симв.]` : s;
}

export type AgentTurnLog = {
  agentId: string;
  model: string;
  ok: boolean;
  latencyMs?: number;
  status?: number;
  error?: string;
  turns: { role: string; content: string }[];
  reply: string;
};

export function logAgentTurn(entry: AgentTurnLog): void {
  try {
    const line =
      JSON.stringify({
        time: new Date().toISOString(),
        agentId: entry.agentId,
        model: entry.model,
        ok: entry.ok,
        latencyMs: entry.latencyMs,
        status: entry.status,
        error: entry.error,
        turns: entry.turns.map((t) => ({ role: t.role, content: trunc(t.content) })),
        reply: trunc(entry.reply),
      }) + "\n";
    fs.appendFileSync(LOG_PATH, line);
  } catch {
    /* logging is best-effort — never throw */
  }
}
