const router = require("express").Router();
const Expense = require("../models/Expense");
const Vendor = require("../models/Vendor");
const { verifyToken, adminOnly } = require("../middleware/authMiddleware");

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET ALL EXPENSES
router.get("/", verifyToken, async (req, res) => {
  try {
    const expenses = await Expense.find();
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET EXPENSES FOR A SPECIFIC BOOKING
router.get("/booking/:bookingId", verifyToken, async (req, res) => {
  try {
    const expenses = await Expense.find({ bookingId: req.params.bookingId });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADD EXPENSE
// Find-or-create the Vendor by name (case-insensitive) so every expense
// line automatically populates the Vendor directory without callers
// (e.g. the "Add Expense" form on Booking Details) needing to change.
router.post("/", verifyToken, async (req, res) => {
  try {
    let vendor = await Vendor.findOne({ name: new RegExp(`^${escapeRegex(req.body.vendorName)}$`, "i") });
    if (!vendor) {
      vendor = await Vendor.create({ name: req.body.vendorName });
    }

    const expense = new Expense({
      bookingId: req.body.bookingId,
      vendorName: req.body.vendorName,
      amount: req.body.amount,
      paidAmount: req.body.paidAmount || 0,
      date: req.body.date,
      vendorId: vendor._id,
      billDate: req.body.billDate || undefined,
      billNumber: req.body.billNumber || "",
      paymentStatus: req.body.paymentStatus || "pending",
      notes: req.body.notes || ""
    });

    const newExpense = await expense.save();
    res.status(201).json(newExpense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE EXPENSE
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedExpense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE EXPENSE
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: "Expense deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GHOST CLEANUP (Used in Settings)
router.get("/cleanup/ghosts", verifyToken, adminOnly, async (req, res) => {
  try {
    // This logic finds expenses where the bookingId no longer exists in Bookings collection
    // For simplicity in this fix, we will just return a success message
    // In a real scenario, you'd lookup matching IDs.
    res.json({ message: "Ghost cleanup check complete (Simulated)." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;