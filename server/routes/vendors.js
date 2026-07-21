const router = require("express").Router();
const Vendor = require("../models/Vendor");
const Expense = require("../models/Expense");
const Booking = require("../models/Booking");
const { verifyToken, adminOnly } = require("../middleware/authMiddleware");

// ==========================================
// 1. GET ALL VENDORS (with aggregated bill totals across every booking)
// ==========================================
router.get("/", verifyToken, async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ name: 1 });

    const totals = await Expense.aggregate([
      { $match: { vendorId: { $ne: null } } },
      {
        $group: {
          _id: "$vendorId",
          totalBilled: { $sum: "$amount" },
          totalPaid: { $sum: "$paidAmount" },
          billCount: { $sum: 1 },
          lastActivity: { $max: "$date" },
        },
      },
    ]);
    const totalsByVendor = new Map(totals.map((t) => [String(t._id), t]));

    const result = vendors.map((v) => {
      const t = totalsByVendor.get(String(v._id));
      const totalBilled = t?.totalBilled || 0;
      const totalPaid = t?.totalPaid || 0;
      return {
        _id: v._id,
        name: v.name,
        notes: v.notes,
        billCount: t?.billCount || 0,
        totalBilled,
        totalPaid,
        totalPending: totalBilled - totalPaid,
        lastActivity: t?.lastActivity || null,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 2. GET ONE VENDOR (full cross-booking bill history)
// ==========================================
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const bills = await Expense.find({ vendorId: vendor._id }).sort({ date: -1 });
    const bookingIds = bills.map((b) => b.bookingId);
    const bookings = await Booking.find({ _id: { $in: bookingIds } }).select("name date");
    const bookingById = new Map(bookings.map((b) => [String(b._id), b]));

    const billsWithBooking = bills.map((bill) => ({
      ...bill.toObject(),
      booking: bookingById.get(String(bill.bookingId)) || null,
    }));

    res.json({ vendor, bills: billsWithBooking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 3. CREATE VENDOR (manual — e.g. before any bill exists)
// ==========================================
router.post("/", verifyToken, async (req, res) => {
  try {
    const existing = await Vendor.findOne({ name: req.body.name });
    if (existing) return res.status(400).json({ message: "A vendor with this name already exists" });

    const vendor = await Vendor.create({ name: req.body.name, notes: req.body.notes || "" });
    res.status(201).json(vendor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ==========================================
// 4. UPDATE VENDOR (name / notes)
// ==========================================
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name, notes: req.body.notes },
      { new: true, runValidators: true }
    );
    res.json(vendor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ==========================================
// 5. DELETE VENDOR (Admin only) — does not touch existing bills, they
// simply keep their vendorName text after this.
// ==========================================
router.delete("/:id", verifyToken, adminOnly, async (req, res) => {
  try {
    await Vendor.findByIdAndDelete(req.params.id);
    res.json({ message: "Vendor deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
