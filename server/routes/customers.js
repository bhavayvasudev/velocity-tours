const router = require("express").Router();
const Booking = require("../models/Booking");
const { verifyToken } = require("../middleware/authMiddleware");

// Customers have no dedicated model — clientName lives directly on Booking,
// the same way vendorName worked before the Vendor model existed. Nobody
// creates/edits a customer standalone in this app, so we aggregate straight
// off Booking instead of introducing a collection nothing else needs.
// Mirrors vendors.js's aggregation shape exactly, just grouped by clientName.

// ==========================================
// 1. GET ALL CUSTOMERS (aggregated across every booking)
// ==========================================
router.get("/", verifyToken, async (req, res) => {
  try {
    const totals = await Booking.aggregate([
      {
        $group: {
          _id: "$clientName",
          totalBilled: { $sum: "$totalClientPayment" },
          totalPaid: { $sum: "$clientPaidAmount" },
          bookingCount: { $sum: 1 },
          lastActivity: { $max: "$date" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const result = totals.map((t) => ({
      name: t._id,
      bookingCount: t.bookingCount,
      totalBilled: t.totalBilled || 0,
      totalPaid: t.totalPaid || 0,
      totalPending: (t.totalBilled || 0) - (t.totalPaid || 0),
      lastActivity: t.lastActivity || null,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 2. GET ONE CUSTOMER (full cross-booking history, by exact clientName)
// ==========================================
router.get("/:name", verifyToken, async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const bookings = await Booking.find({ clientName: name }).sort({ date: 1 });
    if (bookings.length === 0) return res.status(404).json({ message: "Customer not found" });

    const totalBilled = bookings.reduce((s, b) => s + (b.totalClientPayment || 0), 0);
    const totalPaid = bookings.reduce((s, b) => s + (b.clientPaidAmount || 0), 0);

    res.json({
      customer: { name, totalBilled, totalPaid, totalPending: totalBilled - totalPaid, bookingCount: bookings.length },
      bookings,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
