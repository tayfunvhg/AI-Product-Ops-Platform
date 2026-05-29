/**
 * X5 Copilot (chat completions) client — server-side only.
 *
 * Implements the integration guide:
 *  - both auth modes (Bearer / X-API-Key) with one retry on 401/403
 *  - robust response parsing (OpenAI-like, gateway-wrapped, plain text)
 *  - optional strict-JSON extraction with a light "repair" step
 *
 * Never import this from a client component — it reads process.env secrets.
 */

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type X5Config = {
  apiKey: string;
  url: string;
  model: string;
  authMode: "bearer" | "x-api-key";
  provider: "x5" | "deepseek";
};

/**
 * Resolve LLM provider config from env.
 *
 * Default provider is X5 Copilot. Set LLM_PROVIDER=deepseek to use DeepSeek
 * instead (handy for local testing without the corporate VPN — DeepSeek is a
 * public, OpenAI-compatible endpoint). Both are chat-completions compatible,
 * so the rest of the client is unchanged.
 */
export function getX5Config(): X5Config | null {
  const provider = (process.env.LLM_PROVIDER || "x5").trim().toLowerCase();

  if (provider === "deepseek") {
    const apiKey = (process.env.DEEPSEEK_API_KEY || "").trim();
    const url = (
      process.env.DEEPSEEK_COMPLETIONS_URL || "https://api.deepseek.com/chat/completions"
    ).trim();
    const model = (process.env.DEEPSEEK_MODEL || "deepseek-chat").trim();
    if (!apiKey || apiKey === "your-key-here") return null;
    return { apiKey, url, model, authMode: "bearer", provider: "deepseek" };
  }

  const apiKey = (process.env.X5_COPILOT_API_KEY || "").trim();
  const url = (process.env.X5_COPILOT_COMPLETIONS_URL || "").trim();
  const model = (process.env.X5_COPILOT_MODEL || "copilot-flash").trim();
  const authMode = (
    (process.env.X5_COPILOT_AUTH_MODE || "bearer").trim().toLowerCase() === "x-api-key"
      ? "x-api-key"
      : "bearer"
  ) as "bearer" | "x-api-key";

  if (!apiKey || !url || apiKey === "your-key-here") return null;
  return { apiKey, url, model, authMode, provider: "x5" };
}

/**
 * Candidate endpoint URLs to try, in order.
 *
 * For X5 the integration guide documents `api-copilot.x5.ru`, but that host
 * does not always resolve, while `copilot.x5.ru` / `api.x5.ru` do. We try the
 * configured URL first and then the same path on known alternate hosts. We
 * only fall through on network/DNS errors — never on a real HTTP response.
 * For other providers (e.g. DeepSeek) we only use the configured URL.
 */
export function candidateUrls(primary: string, provider: "x5" | "deepseek" = "x5"): string[] {
  if (provider !== "x5") return [primary];
  const urls = [primary];
  try {
    const u = new URL(primary);
    const altHosts = ["api-copilot.x5.ru", "copilot.x5.ru", "api.x5.ru"];
    for (const host of altHosts) {
      if (host === u.host) continue;
      const alt = new URL(primary);
      alt.host = host;
      const s = alt.toString();
      if (!urls.includes(s)) urls.push(s);
    }
  } catch {
    // primary not a valid URL — just return it as-is
  }
  return urls;
}

export type ChatResult = {
  ok: boolean;
  text: string;
  latencyMs: number;
  model: string;
  status?: number;
  error?: string;
  raw?: unknown;
};

/**
 * Low-level chat completion. Tries the preferred auth header, then the
 * alternate one on 401/403. Returns the assistant text (best effort).
 */
export async function x5ChatCompletion(
  messages: ChatMessage[],
  opts: { temperature?: number; timeoutMs?: number } = {}
): Promise<ChatResult> {
  const cfg = getX5Config();
  const started = Date.now();
  if (!cfg) {
    return {
      ok: false,
      text: "",
      latencyMs: 0,
      model: "n/a",
      error:
        "X5 Copilot не сконфигурирован. Заполните X5_COPILOT_API_KEY и X5_COPILOT_COMPLETIONS_URL в .env.local.",
    };
  }

  const { apiKey, url, model, authMode, provider } = cfg;
  const temperature = opts.temperature ?? 0.2;
  const timeoutMs = opts.timeoutMs ?? 25000;

  const bearer = { Authorization: `Bearer ${apiKey}` };
  const xApiKey = { "X-API-Key": apiKey };
  const variants =
    authMode === "x-api-key" ? [xApiKey, bearer] : [bearer, xApiKey];

  const body = JSON.stringify({ model, messages, temperature });

  let lastErr = "";
  let lastStatus: number | undefined;

  // Try the configured URL, then known alternate hosts on network/DNS errors.
  for (const endpoint of candidateUrls(url, provider)) {
    for (const authHeaders of variants) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const resp = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...authHeaders,
          },
          body,
          signal: controller.signal,
          cache: "no-store",
        });
        clearTimeout(timer);
        lastStatus = resp.status;

        if (!resp.ok) {
          const errText = await safeText(resp);
          if (resp.status === 401 || resp.status === 403) {
            lastErr = `auth ${resp.status}: ${errText}`;
            continue; // retry alternate auth header on this host
          }
          return {
            ok: false,
            text: "",
            latencyMs: Date.now() - started,
            model,
            status: resp.status,
            error: `HTTP ${resp.status}: ${errText}`,
          };
        }

        const data = await resp.json().catch(async () => ({
          _raw_text: await safeText(resp),
        }));
        return {
          ok: true,
          text: extractText(data),
          latencyMs: Date.now() - started,
          model,
          status: resp.status,
          raw: data,
        };
      } catch (e: unknown) {
        clearTimeout(timer);
        lastErr =
          e instanceof Error
            ? e.name === "AbortError"
              ? `timeout после ${timeoutMs}ms`
              : e.message
            : String(e);
        // network / DNS error -> try next auth variant, then next host
      }
    }
  }

  return {
    ok: false,
    text: "",
    latencyMs: Date.now() - started,
    model,
    status: lastStatus,
    error: lastErr || "Запрос к X5 не удался",
  };
}

async function safeText(resp: Response): Promise<string> {
  try {
    const t = await resp.text();
    return t.slice(0, 500);
  } catch {
    return "";
  }
}

/** Best-effort extraction of assistant text from varied response shapes. */
export function extractText(data: unknown): string {
  if (typeof data === "string") return data;
  if (!data || typeof data !== "object") return "";
  const obj = data as Record<string, any>;

  const candidates = [
    obj?.choices?.[0]?.message?.content,
    obj?.choices?.[0]?.text,
    obj?.result?.choices?.[0]?.message?.content,
    obj?.data?.choices?.[0]?.message?.content,
    obj?.message?.content,
    obj?.text,
    obj?.content,
    obj?.message,
    obj?._raw_text,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c;
  }
  return "";
}

/**
 * Extract and parse the first JSON object found in text, with a light repair.
 * Returns null if nothing parseable is found.
 */
export function extractJson<T = unknown>(text: string): T | null {
  if (!text) return null;
  const trimmed = text.trim();

  const tryParse = (s: string): T | null => {
    try {
      return JSON.parse(s) as T;
    } catch {
      return null;
    }
  };

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    const direct = tryParse(trimmed);
    if (direct) return direct;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  const block = match ? match[0] : trimmed;
  const direct = tryParse(block);
  if (direct) return direct;

  // light repair: drop repeated quotes and trailing commas
  const repaired = block
    .replace(/"{2,}/g, '"')
    .replace(/,\s*([}\]])/g, "$1");
  return tryParse(repaired);
}
