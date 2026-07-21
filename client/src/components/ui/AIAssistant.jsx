import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Send,
  Paperclip,
  Bot,
  User,
  Plus,
  History,
  Search,
  Pencil,
  Trash2,
  ArrowLeft,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import Drawer from "./Drawer";
import {
  getStatus,
  listConversations,
  getConversation,
  renameConversation,
  deleteConversation,
  streamChat,
  SUGGESTED_PROMPTS,
} from "../../lib/aiAssistant";

// Minimal hand-rolled markdown renderer (bold / italic / inline code /
// links, "- " lists, fenced code blocks, pipe tables, headings) — no
// dependency, since this only ever renders the assistant's own replies,
// not arbitrary untrusted input.
function parseInline(text, keyPrefix) {
  const nodes = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\)/g;
  let lastIndex = 0;
  let match;
  let i = 0;
  while ((match = regex.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    if (match[1] !== undefined) nodes.push(<strong key={`${keyPrefix}-${i++}`}>{match[1]}</strong>);
    else if (match[2] !== undefined) nodes.push(<em key={`${keyPrefix}-${i++}`}>{match[2]}</em>);
    else if (match[3] !== undefined)
      nodes.push(
        <code key={`${keyPrefix}-${i++}`} className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-700">
          {match[3]}
        </code>
      );
    else if (match[4] !== undefined)
      nodes.push(
        <a key={`${keyPrefix}-${i++}`} href={match[5]} target="_blank" rel="noreferrer" className="text-blue-600 underline dark:text-blue-400">
          {match[4]}
        </a>
      );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

const isTableSeparator = (line) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(line || "");
const splitRow = (line) => line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

function renderMarkdown(text) {
  const lines = text.split("\n");
  const blocks = [];
  let listBuffer = [];
  const flushList = (key) => {
    if (listBuffer.length > 0) {
      blocks.push(
        <ul key={`ul-${key}`} className="list-disc space-y-0.5 pl-5">
          {listBuffer}
        </ul>
      );
      listBuffer = [];
    }
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      flushList(i);
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      blocks.push(
        <pre key={`code-${i}`} className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100 dark:bg-slate-950">
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    if (trimmed.startsWith("|") && isTableSeparator(lines[i + 1])) {
      flushList(i);
      const header = splitRow(trimmed);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      blocks.push(
        <div key={`table-${i}`} className="overflow-x-auto">
          <table className="my-1 w-full border-collapse text-xs">
            <thead>
              <tr>
                {header.map((c, ci) => (
                  <th key={ci} className="border-b border-[var(--color-border-subtle)] px-2 py-1 text-left font-semibold">
                    {parseInline(c, `th-${i}-${ci}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((c, ci) => (
                    <td key={ci} className="border-b border-[var(--color-border-subtle)]/50 px-2 py-1 align-top">
                      {parseInline(c, `td-${i}-${ri}-${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      listBuffer.push(<li key={`li-${i}`}>{parseInline(trimmed.slice(2), `li-${i}`)}</li>);
      i++;
      continue;
    }

    flushList(i);
    if (trimmed === "") {
      blocks.push(<div key={`sp-${i}`} className="h-2" />);
    } else if (/^#{1,6}\s/.test(trimmed)) {
      const level = trimmed.match(/^#+/)[0].length;
      const content = trimmed.replace(/^#{1,6}\s/, "");
      const Tag = `h${Math.min(level + 2, 6)}`;
      blocks.push(
        <Tag key={`h-${i}`} className="font-bold">
          {parseInline(content, `h-${i}`)}
        </Tag>
      );
    } else {
      blocks.push(<p key={`p-${i}`}>{parseInline(trimmed, `p-${i}`)}</p>);
    }
    i++;
  }
  flushList("end");
  return blocks;
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

function MessageBubble({ role, content, streaming, isError }) {
  const isUser = role === "user";
  return (
    <div className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300"
            : isError
            ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300"
            : "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300"
        }`}
      >
        {isUser ? <User size={14} /> : isError ? <AlertTriangle size={14} /> : <Bot size={14} />}
      </span>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
          isUser
            ? "bg-blue-600 text-white"
            : isError
            ? "border border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300"
            : "bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200"
        }`}
      >
        {content ? renderMarkdown(content) : streaming ? <TypingDots /> : null}
      </div>
    </div>
  );
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function groupByRecency(conversations) {
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);

  const groups = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Last 7 Days", items: [] },
    { label: "Older", items: [] },
  ];

  for (const c of conversations) {
    const d = new Date(c.updatedAt);
    if (d >= today) groups[0].items.push(c);
    else if (d >= yesterday) groups[1].items.push(c);
    else if (d >= weekAgo) groups[2].items.push(c);
    else groups[3].items.push(c);
  }

  return groups.filter((g) => g.items.length > 0);
}

function HistoryRow({ conv, active, onOpen, onDelete, isRenaming, renameValue, onRenameChange, onRenameStart, onRenameSubmit, onRenameCancel }) {
  if (isRenaming) {
    return (
      <div className="flex items-center gap-1.5 rounded-lg px-2 py-1.5">
        <input
          autoFocus
          value={renameValue}
          onChange={(e) => onRenameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onRenameSubmit();
            if (e.key === "Escape") onRenameCancel();
          }}
          className="min-w-0 flex-1 rounded-md border border-blue-300 bg-[var(--color-surface)] px-2 py-1 text-xs outline-none"
        />
        <button onClick={onRenameSubmit} className="text-emerald-600 hover:text-emerald-700" aria-label="Save name">
          <Check size={14} />
        </button>
        <button onClick={onRenameCancel} className="text-slate-400 hover:text-slate-600" aria-label="Cancel rename">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`group flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
        active ? "bg-blue-50 dark:bg-blue-900/30" : "hover:bg-slate-100 dark:hover:bg-slate-700/40"
      }`}
    >
      <button onClick={onOpen} className="min-w-0 flex-1 truncate text-left text-slate-700 dark:text-slate-200">
        {conv.title || "New Conversation"}
      </button>
      <button
        onClick={onRenameStart}
        className="shrink-0 text-slate-300 opacity-0 hover:text-slate-600 group-hover:opacity-100 dark:text-slate-500 dark:hover:text-slate-300"
        aria-label="Rename conversation"
      >
        <Pencil size={13} />
      </button>
      <button
        onClick={onDelete}
        className="shrink-0 text-slate-300 opacity-0 hover:text-red-500 group-hover:opacity-100 dark:text-slate-500"
        aria-label="Delete conversation"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("chat"); // "chat" | "history"

  const [configured, setConfigured] = useState(null); // null = unknown yet

  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);

  const [conversations, setConversations] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const scrollRef = useRef(null);

  // One status check per full page load — the assistant itself resets to a
  // blank draft conversation on every mount, so a browser refresh always
  // lands the user in a fresh chat rather than resuming the previous one.
  useEffect(() => {
    getStatus().then(setConfigured);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const refreshHistory = async (search = "") => {
    setLoadingHistory(true);
    try {
      const list = await listConversations(search);
      setConversations(list);
    } catch {
      setConversations([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const openHistory = () => {
    setView("history");
    refreshHistory(searchQuery);
  };

  useEffect(() => {
    if (view !== "history") return;
    const t = setTimeout(() => refreshHistory(searchQuery), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const startNewChat = () => {
    setConversationId(null);
    setMessages([]);
    setView("chat");
  };

  const openConversation = async (id) => {
    try {
      const conv = await getConversation(id);
      setConversationId(conv._id);
      setMessages(conv.messages.map(({ role, content }) => ({ role, content })));
      setView("chat");
    } catch {
      // leave the user in the history list if the fetch fails
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this conversation? This cannot be undone.")) return;
    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c._id !== id));
      if (id === conversationId) startNewChat();
    } catch {
      // list stays as-is; user can retry
    }
  };

  const submitRename = async () => {
    const id = renamingId;
    const title = renameValue.trim();
    setRenamingId(null);
    if (!id || !title) return;
    try {
      const updated = await renameConversation(id, title);
      setConversations((prev) => prev.map((c) => (c._id === id ? { ...c, title: updated.title } : c)));
    } catch {
      // ignore — row keeps its previous title
    }
  };

  const handleSend = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || streaming || configured === false) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed }, { role: "assistant", content: "" }]);
    setStreaming(true);

    await streamChat({
      conversationId,
      message: trimmed,
      onMeta: ({ conversationId: newId, title }) => {
        setConversationId((prev) => prev || newId);
        setConversations((prev) => {
          const rest = prev.filter((c) => c._id !== newId);
          return [{ _id: newId, title, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...rest];
        });
      },
      onDelta: (chunk) => {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = { ...last, content: last.content + chunk };
          return next;
        });
      },
      onDone: () => setStreaming(false),
      onError: (err) => {
        setStreaming(false);
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: err.message || "AI Assistant request failed.", isError: true };
          return next;
        });
      },
    });
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const grouped = groupByRecency(conversations);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open AI Assistant"
        className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-[0_8px_20px_-6px_rgba(124,58,237,0.5)] transition-shadow hover:shadow-[0_10px_24px_-6px_rgba(124,58,237,0.6)] md:bottom-8 md:left-8"
      >
        <Sparkles size={24} />
      </button>

      <Drawer open={open} onOpenChange={setOpen} placement="right" title="AI Assistant">
        <div className="flex h-full flex-col">
          <div className="mb-3 flex items-center gap-2 border-b border-[var(--color-border-subtle)] pb-3">
            {view === "chat" ? (
              <>
                <button
                  onClick={startNewChat}
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border-subtle)] px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/40"
                >
                  <Plus size={13} /> New chat
                </button>
                <button
                  onClick={openHistory}
                  className="ml-auto flex items-center gap-1.5 rounded-lg border border-[var(--color-border-subtle)] px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/40"
                >
                  <History size={13} /> History
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setView("chat")}
                  aria-label="Back to chat"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/40"
                >
                  <ArrowLeft size={15} />
                </button>
                <div className="relative flex-1">
                  <Search size={12} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] py-1.5 pl-7 pr-2 text-xs outline-none focus:border-blue-400"
                  />
                </div>
              </>
            )}
          </div>

          {configured === false && (
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>AI Assistant is not configured: <code>NVIDIA_API_KEY</code> is missing on the server.</span>
            </div>
          )}

          {view === "history" ? (
            <div className="flex-1 space-y-4 overflow-y-auto pb-2">
              {loadingHistory ? (
                <p className="px-2 text-xs text-slate-400">Loading…</p>
              ) : grouped.length === 0 ? (
                <p className="px-2 text-xs text-slate-400">{searchQuery ? "No matching conversations." : "No conversations yet."}</p>
              ) : (
                grouped.map((group) => (
                  <div key={group.label}>
                    <p className="mb-1 px-2 text-xs font-bold uppercase tracking-wide text-slate-400">{group.label}</p>
                    <div className="space-y-0.5">
                      {group.items.map((conv) => (
                        <HistoryRow
                          key={conv._id}
                          conv={conv}
                          active={conv._id === conversationId}
                          onOpen={() => openConversation(conv._id)}
                          onDelete={() => handleDelete(conv._id)}
                          isRenaming={renamingId === conv._id}
                          renameValue={renameValue}
                          onRenameChange={setRenameValue}
                          onRenameStart={() => {
                            setRenamingId(conv._id);
                            setRenameValue(conv.title || "");
                          }}
                          onRenameSubmit={submitRename}
                          onRenameCancel={() => setRenamingId(null)}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pb-2">
              {messages.length === 0 ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-dashed border-[var(--color-border-subtle)] p-4 text-center">
                    <Sparkles size={22} className="mx-auto mb-2 text-violet-500" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ask me anything about your business</p>
                    <p className="mt-1 text-xs text-slate-400">Powered by NVIDIA Nemotron.</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Suggested prompts</p>
                    {SUGGESTED_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => handleSend(prompt)}
                        disabled={configured === false}
                        className="block w-full rounded-xl border border-[var(--color-border-subtle)] px-3 py-2.5 text-left text-sm text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700/40"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m, i) => (
                  <MessageBubble
                    key={i}
                    role={m.role}
                    content={m.content}
                    isError={m.isError}
                    streaming={streaming && i === messages.length - 1}
                  />
                ))
              )}
            </div>
          )}

          {view === "chat" && (
            <div className="mt-3 flex items-end gap-2 border-t border-[var(--color-border-subtle)] pt-3">
              <button
                disabled
                title="File upload — coming soon"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-300 dark:text-slate-600"
              >
                <Paperclip size={16} />
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={configured === false ? "AI Assistant is not configured..." : "Message the assistant..."}
                disabled={configured === false}
                rows={1}
                className="max-h-28 flex-1 resize-none rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-400 disabled:opacity-50 dark:text-white"
              />
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || streaming || configured === false}
                aria-label="Send message"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
              >
                <Send size={15} />
              </button>
            </div>
          )}
        </div>
      </Drawer>
    </>
  );
}
