const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vendor', VendorSchema);
