const router = require("express").Router();
const CashEntry = require("../models/CashEntry");
const { verifyToken } = require("../middleware/authMiddleware");

// ==========================================
// 1. GET ALL CASH ENTRIES (with optional filters)
// ==========================================
router.get("/", verifyToken, async (req, res) => {
  try {
    const { type, bank, search, from, to } = req.query;
    const query = {};

    if (type) query.type = type;
    if (bank) query.bank = bank;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ receivedFrom: re }, { depositedTo: re }, { receivedBy: re }, { remarks: re }];
    }

    const entries = await CashEntry.find(query).sort({ date: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 2. CASH SUMMARY (totals + per-bank breakdown, for dashboard + module cards)
// ==========================================
router.get("/summary", verifyToken, async (req, res) => {
  try {
    const entries = await CashEntry.find();

    const totals = { received: 0, deposited: 0, withdrawn: 0 };
    const byBank = {};

    entries.forEach((e) => {
      totals[e.type] += e.amount;
      const bankKey = e.bank || "Unassigned";
      byBank[bankKey] = byBank[bankKey] || { received: 0, deposited: 0, withdrawn: 0 };
      byBank[bankKey][e.type] += e.amount;
    });

    const netCashInHand = totals.received - totals.deposited - totals.withdrawn;

    res.json({
      totalReceived: totals.received,
      totalDeposited: totals.deposited,
      totalWithdrawn: totals.withdrawn,
      netCashInHand,
      byBank,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 3. CREATE CASH ENTRY
// ==========================================
router.post("/", verifyToken, async (req, res) => {
  try {
    const entry = await CashEntry.create({
      type: req.body.type,
      amount: req.body.amount,
      date: req.body.date || undefined,
      depositDate: req.body.depositDate || undefined,
      receivedFrom: req.body.receivedFrom || "",
      depositedTo: req.body.depositedTo || "",
      receivedBy: req.body.receivedBy || "",
      bank: req.body.bank || "",
      remarks: req.body.remarks || "",
    });
    res.status(201).json(entry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ==========================================
// 4. UPDATE CASH ENTRY
// ==========================================
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const entry = await CashEntry.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json(entry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ==========================================
// 5. DELETE CASH ENTRY
// ==========================================
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await CashEntry.findByIdAndDelete(req.params.id);
    res.json({ message: "Cash entry deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
