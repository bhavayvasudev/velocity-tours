const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Plain string (hashed manually in auth.js)
    role: { type: String, default: "staff" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);