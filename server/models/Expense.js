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
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Expense', ExpenseSchema);