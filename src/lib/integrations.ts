/**
 * Integration adapters — STUBS for the prototype.
 *
 * Real connectors (Confluence, Трекер, Insight, Qlik) land on Этап F and live
 * behind these same function signatures. See docs/ARCHITECTURE.md §5. None of
 * these make network calls yet — they return a believable result so the UI flow
 * (buttons, confirmations) is fully wired.
 */

export type ConfluenceResult = { ok: boolean; url?: string; note: string };

/** Pretend to publish a page to Confluence; returns a plausible page URL. */
export function confluenceExport(title: string): ConfluenceResult {
  const slug = encodeURIComponent(title.trim().slice(0, 80).replace(/\s+/g, "-"));
  return {
    ok: true,
    url: `https://confluence.x5.ru/display/PRODUCT/${slug}`,
    note: "Заглушка: реальная публикация в Confluence подключается на этапе интеграций.",
  };
}

export type TrackerSyncResult = {
  ok: boolean;
  pushed: number; // new items sent to the board
  matched: number; // existing items reconciled
  note: string;
};

/** Pretend to sync hypotheses with the Tracker board. */
export function trackerSync(newCount: number, existingCount: number): TrackerSyncResult {
  return {
    ok: true,
    pushed: newCount,
    matched: existingCount,
    note: "Заглушка: реальная синхронизация с Трекером подключается на этапе интеграций.",
  };
}
