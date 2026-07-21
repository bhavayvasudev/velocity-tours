// Single choke point for every outbound AI request — the NVIDIA API key
// never leaves the server (the client only ever talks to /api/ai/*), and
// every config knob lives in env vars so swapping model/provider needs no
// code changes, just a .env edit + restart.
const DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1";
const DEFAULT_MODEL = "nvidia/llama-3.1-nemotron-70b-instruct";
// Aborts if no new chunk arrives for this long — a per-chunk idle timeout
// rather than a total-request timeout, since streamed replies can legally
// take longer than 30s end-to-end as long as tokens keep arriving.
const IDLE_TIMEOUT_MS = 30_000;

const SYSTEM_PROMPT = `You are the Velocity Tours business assistant, built into the Velocity Tracker admin dashboard.

You help the team with day-to-day operations across:
- Bookings and itineraries
- Invoices and Payments
- Vendor Bills and Vendor Ledgers
- Cash Management
- GST and tax filing
- Customer Ledgers
- Excel Exports and Reports

Answer naturally and concisely. Use markdown (headings, bold, lists, tables, code blocks) when it makes an answer clearer.

You do NOT currently have a live connection to the application's database, so you cannot look up real booking, payment, vendor, or cash figures. If asked something that needs live data (e.g. "who owes us money", "what was revenue this month", "how much GST do we owe"), say plainly that you don't have live access to that data yet instead of guessing or inventing numbers — then point to where in the app it can be found (Bookings, Payments, Vendors, Cash Management, or Reports).

You can still explain how features work, help draft messages, do calculations the user supplies numbers for, and answer general business/tax questions.`;

function isConfigured() {
  return Boolean(process.env.NVIDIA_API_KEY);
}

// Thrown by chatStream() with a `code` the route handler can map to a
// user-facing message, instead of collapsing everything to a generic
// "something went wrong".
class AiServiceError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

// Streams a chat completion from NVIDIA, invoking onDelta(text) as each
// token chunk arrives, and resolving with the full assembled reply.
async function chatStream(messages, onDelta) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new AiServiceError("missing_api_key", "NVIDIA_API_KEY is not set");

  const baseUrl = process.env.AI_BASE_URL || DEFAULT_BASE_URL;
  const model = process.env.AI_MODEL || DEFAULT_MODEL;

  console.log(`[ai] request -> model=${model} url=${baseUrl}/chat/completions messages=${messages.length}`);

  const controller = new AbortController();
  let idleTimer = setTimeout(() => controller.abort(), IDLE_TIMEOUT_MS);
  const resetIdleTimer = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => controller.abort(), IDLE_TIMEOUT_MS);
  };

  let res;
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      // chat_template_kwargs.thinking:false turns off this model's chain-of-
      // thought pass — without it, a long enough reasoning trace can burn
      // through the whole token budget and finish with zero visible content,
      // which surfaced as an "empty response" error on real follow-up turns.
      body: JSON.stringify({ model, messages, stream: true, max_tokens: 4096, chat_template_kwargs: { thinking: false } }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(idleTimer);
    if (err.name === "AbortError") {
      console.error(`[ai] timeout after ${IDLE_TIMEOUT_MS}ms`);
      throw new AiServiceError("timeout", "NVIDIA API request timed out");
    }
    console.error("[ai] network error:", err.message);
    throw new AiServiceError("network_error", `Could not reach NVIDIA API: ${err.message}`);
  }

  if (!res.ok) {
    clearTimeout(idleTimer);
    const text = await res.text().catch(() => "");
    console.error(`[ai] response status=${res.status} model=${model} body=${text.slice(0, 500)}`);

    if (res.status === 401 || res.status === 403) {
      throw new AiServiceError("invalid_api_key", `NVIDIA API rejected the API key (${res.status})`);
    }
    if (res.status === 404) {
      throw new AiServiceError("model_not_found", `Model "${model}" not found (404)`);
    }
    if (res.status === 429 || res.status === 503) {
      throw new AiServiceError("rate_limited", `NVIDIA API rate limited the request (${res.status})`);
    }
    throw new AiServiceError("bad_response", `NVIDIA API error (${res.status}): ${text.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      resetIdleTimer();

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // keep the trailing partial line for next read

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") continue;

        let json;
        try {
          json = JSON.parse(payload);
        } catch {
          // Malformed/partial SSE chunk — the next chunk usually completes
          // the JSON on the following read.
          continue;
        }

        // NVIDIA can respond HTTP 200 and stream an in-band error object
        // instead of delta chunks (e.g. worker overload) — treated as a
        // real failure rather than silently producing an empty reply.
        if (json.error) {
          const errMsg = json.error.message || JSON.stringify(json.error);
          console.error(`[ai] in-stream error: ${errMsg}`);
          const code = /resourceexhausted|rate.?limit|overload/i.test(errMsg) ? "rate_limited" : "bad_response";
          throw new AiServiceError(code, `NVIDIA API error: ${errMsg}`);
        }

        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          onDelta(delta);
        }
      }
    }
  } catch (err) {
    if (err instanceof AiServiceError) throw err;
    if (err.name === "AbortError") {
      console.error(`[ai] stream idle timeout after ${IDLE_TIMEOUT_MS}ms`);
      throw new AiServiceError("timeout", "NVIDIA API stream stalled and timed out");
    }
    console.error("[ai] stream read error:", err.message);
    throw new AiServiceError("network_error", `AI stream interrupted: ${err.message}`);
  } finally {
    clearTimeout(idleTimer);
  }

  if (!full) {
    console.error("[ai] streamed response had no content");
    throw new AiServiceError("invalid_response", "NVIDIA API returned an empty response");
  }

  console.log(`[ai] response ok, ${full.length} chars`);
  return full;
}

// Cheap, deterministic conversation title from the first user message —
// no extra AI call needed just to name a chat.
function generateTitle(message) {
  const cleaned = (message || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return "New Conversation";

  const words = cleaned.split(" ");
  let title = words.slice(0, 8).join(" ");
  if (words.length > 8) title += "…";
  if (title.length > 60) title = `${title.slice(0, 57)}…`;

  return title.charAt(0).toUpperCase() + title.slice(1);
}

module.exports = { isConfigured, chatStream, generateTitle, SYSTEM_PROMPT, AiServiceError };
