const mongoose = require('mongoose');

const CashEntrySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["received", "deposited", "withdrawn"], required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    depositDate: { type: Date },
    receivedFrom: { type: String, default: "" }, // who the cash came from (type: received)
    depositedTo: { type: String, default: "" },  // bank/vendor cash was deposited/given to
    receivedBy: { type: String, default: "" },   // staff member who handled it
    bank: { type: String, default: "" },         // ICICI / PNB / Cash-in-hand, for filtering
    remarks: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CashEntry', CashEntrySchema);
