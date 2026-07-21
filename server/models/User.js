const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // Google OAuth is the only login method now. This field is never set for
    // new accounts; it stays optional (unrequired) only so pre-migration
    // documents that still carry a hashed password remain valid to load.
    password: { type: String },
    googleId: { type: String, unique: true, sparse: true },
    role: { type: String, default: "staff" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);