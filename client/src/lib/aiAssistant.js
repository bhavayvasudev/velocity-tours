// All AI requests go through the backend's /api/ai/* routes — the NVIDIA
// API key lives only in server/.env and is never sent to or read by the
// client.
import { API_URL as BASE_API_URL, authHeaders } from "./api";

const API_URL = `${BASE_API_URL}/api`;

export async function getStatus() {
  try {
    const res = await fetch(`${API_URL}/ai/status`, { headers: authHeaders() });
    const data = await res.json().catch(() => ({}));
    return Boolean(data.configured);
  } catch {
    return false;
  }
}

export async function listConversations(search = "") {
  const qs = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
  const res = await fetch(`${API_URL}/ai/conversations${qs}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to load conversations");
  return res.json();
}

export async function getConversation(id) {
  const res = await fetch(`${API_URL}/ai/conversations/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to load conversation");
  return res.json();
}

export async function renameConversation(id, title) {
  const res = await fetch(`${API_URL}/ai/conversations/${id}`, {
    method: "PATCH",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to rename conversation");
  return res.json();
}

export async function deleteConversation(id) {
  const res = await fetch(`${API_URL}/ai/conversations/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) throw new Error("Failed to delete conversation");
}

// Streams a chat reply over SSE. `conversationId` is omitted for a brand
// new chat — the server creates one and reports its id via onMeta.
export async function streamChat({ conversationId, message, onMeta, onDelta, onDone, onError }) {
  let res;
  try {
    res = await fetch(`${API_URL}/ai/chat`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ conversationId, message }),
    });
  } catch (err) {
    onError({ message: `Network error reaching the AI Assistant: ${err.message}`, code: "network_error" });
    return;
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    onError({ message: data.message || `AI Assistant request failed (HTTP ${res.status}).`, code: data.code || "unexpected_error" });
    return;
  }
  if (!res.body) {
    onError({ message: "This browser does not support streaming responses.", code: "unexpected_error" });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop();

    for (const raw of events) {
      let event = "message";
      let dataLine = "";
      for (const line of raw.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLine += line.slice(5).trim();
      }
      if (!dataLine) continue;

      let parsed;
      try {
        parsed = JSON.parse(dataLine);
      } catch {
        continue;
      }

      if (event === "meta") onMeta(parsed);
      else if (event === "delta") onDelta(parsed.content);
      else if (event === "error") onError(parsed);
      else if (event === "done") onDone();
    }
  }
}

export const SUGGESTED_PROMPTS = [
  "Show me pending payments this month",
  "Summarize this month's GST position",
  "Which vendor do we owe the most right now?",
  "Draft a follow-up message to a client",
];
