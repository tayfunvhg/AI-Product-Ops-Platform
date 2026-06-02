/**
 * Lightweight JSON-file persistence for the prototype ("лёгкий бэкенд").
 *
 * Server-only. Collections live as JSON files under /data (gitignored). This
 * is intentionally the simplest backing store that survives restarts and
 * supports the artifact lifecycle. It sits behind repo.ts so it can later be
 * swapped for SQLite/Postgres without touching the rest of the app (see
 * docs/ARCHITECTURE.md §2.1).
 *
 * Do NOT import from client components — it reads/writes the filesystem.
 */
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");

function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function fileFor(name: string): string {
  return path.join(DATA_DIR, `${name}.json`);
}

/**
 * Read a collection. If the file does not exist yet, it is seeded with `seed`
 * (and the seed is persisted), so first run is deterministic.
 */
export function readCollection<T>(name: string, seed: T[] = []): T[] {
  ensureDir();
  const file = fileFor(name);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(seed, null, 2), "utf8");
    return seed;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return Array.isArray(parsed) ? (parsed as T[]) : seed;
  } catch {
    return seed;
  }
}

export function writeCollection<T>(name: string, items: T[]): void {
  ensureDir();
  fs.writeFileSync(fileFor(name), JSON.stringify(items, null, 2), "utf8");
}

/** Read the single settings object (data/settings.json). */
export function readSettings<T extends object>(seed: T): T {
  ensureDir();
  const file = fileFor("settings");
  if (!fs.existsSync(file)) return seed;
  try {
    return { ...seed, ...(JSON.parse(fs.readFileSync(file, "utf8")) as Partial<T>) };
  } catch {
    return seed;
  }
}

export function writeSettings<T extends object>(patch: Partial<T>): void {
  ensureDir();
  const file = fileFor("settings");
  let current: Record<string, unknown> = {};
  try {
    if (fs.existsSync(file)) current = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    /* ignore */
  }
  fs.writeFileSync(file, JSON.stringify({ ...current, ...patch }, null, 2), "utf8");
}
