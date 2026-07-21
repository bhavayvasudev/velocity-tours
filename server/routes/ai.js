const router = require("express").Router();
const { verifyToken } = require("../middleware/authMiddleware");
const Conversation = require("../models/Conversation");
const { isConfigured, chatStream, generateTitle, SYSTEM_PROMPT, AiServiceError } = require("../services/ai");

// GET /api/ai/status — lets the client know up front whether to show the
// assistant as usable, without needing to fire a chat request first.
router.get("/status", verifyToken, (req, res) => {
  res.json({ configured: isConfigured() });
});

/* =========================
   Conversations
========================= */

// GET /api/ai/conversations?search= — sidebar list, metadata only (no
// message bodies) so it stays cheap as history grows.
router.get("/conversations", verifyToken, async (req, res) => {
  const { search } = req.query;
  const filter = { user: req.user._id };
  if (search && search.trim()) {
    filter.title = { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  }

  const conversations = await Conversation.find(filter)
    .select("title createdAt updatedAt")
    .sort({ updatedAt: -1 })
    .lean();

  res.json(conversations);
});

// GET /api/ai/conversations/:id — full conversation with messages.
router.get("/conversations/:id", verifyToken, async (req, res) => {
  const conversation = await Conversation.findOne({ _id: req.params.id, user: req.user._id }).lean().catch(() => null);
  if (!conversation) return res.status(404).json({ message: "Conversation not found" });
  res.json(conversation);
});

// PATCH /api/ai/conversations/:id — { title }
router.patch("/conversations/:id", verifyToken, async (req, res) => {
  const { title } = req.body;
  if (typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ message: "title is required" });
  }

  const conversation = await Conversation.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { title: title.trim().slice(0, 80) },
    { returnDocument: "after" }
  )
    .lean()
    .catch(() => null);

  if (!conversation) return res.status(404).json({ message: "Conversation not found" });
  res.json(conversation);
});

// DELETE /api/ai/conversations/:id
router.delete("/conversations/:id", verifyToken, async (req, res) => {
  const result = await Conversation.deleteOne({ _id: req.params.id, user: req.user._id }).catch(() => null);
  if (!result || result.deletedCount === 0) return res.status(404).json({ message: "Conversation not found" });
  res.status(204).end();
});

/* =========================
   Chat (SSE)
========================= */

// POST /api/ai/chat — { conversationId?, message }
// Streams back Server-Sent Events: `meta` (conversationId/title, sent once
// up front so a brand-new conversation can be adopted by the client),
// `delta` (token chunks), `done`, or `error`.
router.post("/chat", verifyToken, async (req, res) => {
  if (!isConfigured()) {
    console.error("[ai/chat] NVIDIA_API_KEY missing");
    return res.status(503).json({ message: "AI Assistant is not configured: NVIDIA_API_KEY is missing.", code: "missing_api_key" });
  }

  const { conversationId, message } = req.body;
  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ message: "message is required" });
  }

  let conversation;
  if (conversationId) {
    conversation = await Conversation.findOne({ _id: conversationId, user: req.user._id }).catch(() => null);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });
  } else {
    conversation = new Conversation({ user: req.user._id, messages: [] });
  }

  const isFirstMessage = conversation.messages.length === 0;
  conversation.messages.push({ role: "user", content: message.trim() });
  if (isFirstMessage) conversation.title = generateTitle(message.trim());
  await conversation.save();

  const payload = [
    { role: "system", content: SYSTEM_PROMPT },
    ...conversation.messages.map(({ role, content }) => ({ role, content })),
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  send("meta", { conversationId: conversation._id.toString(), title: conversation.title });

  try {
    const fullReply = await chatStream(payload, (delta) => send("delta", { content: delta }));

    conversation.messages.push({ role: "assistant", content: fullReply });
    await conversation.save();

    send("done", {});
  } catch (err) {
    if (err instanceof AiServiceError) {
      console.error(`[ai/chat] ${err.code}: ${err.message}`);
      send("error", { message: err.message, code: err.code });
    } else {
      console.error("[ai/chat] unexpected error:", err.stack || err);
      send("error", { message: `AI Assistant request failed: ${err.message}`, code: "unexpected_error" });
    }
  }

  res.end();
});

module.exports = router;
