const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  vendorName: { type: String, required: true }, // e.g., "Indigo Airlines"
  amount: { type: Number, required: true },     // Total Cost
  paidAmount: { type: Number, default: 0 },     // How much you have paid them so far
  date: { type: Date, default: Date.now },

  // --- Vendor module fields (Phase 5) — all optional so existing
  // documents keep working unmodified. ---
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  billDate: { type: Date },
  billNumber: { type: String, default: "" },
  paymentStatus: { type: String, enum: ["paid", "partial", "pending"], default: "pending" },
  notes: { type: String, default: "" }
});

module.exports = mongoose.model('Expense', ExpenseSchema);