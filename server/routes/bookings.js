const router = require("express").Router();
const Booking = require("../models/Booking");
const Expense = require("../models/Expense");
// 1. Correct Import: Must match the names in authMiddleware.js
const { verifyToken, adminOnly } = require("../middleware/authMiddleware"); 

// ==========================================
// 1. GET ALL BOOKINGS
// ==========================================
router.get("/", verifyToken, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ date: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 2. CREATE BOOKING
// ==========================================
router.post("/", verifyToken, async (req, res) => {
  const booking = new Booking({
    name: req.body.name,
    clientName: req.body.clientName,
    totalClientPayment: req.body.totalClientPayment,
    clientPaidAmount: req.body.clientPaidAmount || 0,
    date: req.body.date
  });

  try {
    const newBooking = await booking.save();
    res.status(201).json(newBooking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ==========================================
// 3. GET SINGLE BOOKING
// ==========================================
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 4. UPDATE BOOKING
// ==========================================
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedBooking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ==========================================
// 5. DELETE BOOKING
// ==========================================
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: "Booking deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 6. DANGER: RESET DATABASE (Used in Settings)
// ==========================================
router.delete("/database/reset", verifyToken, adminOnly, async (req, res) => {
  try {
    await Booking.deleteMany({});
    await Expense.deleteMany({});
    res.json({ message: "Database reset complete. All data deleted." });
  } catch (err) {
    res.status(500).json({ message: "Reset failed", error: err.message });
  }
});

module.exports = router;