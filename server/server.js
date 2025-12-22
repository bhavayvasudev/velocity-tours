require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

/* =========================
   1. CORS CONFIGURATION
========================= */
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

/* =========================
   2. DATABASE
========================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("Mongo Error:", err));

/* =========================
   3. ROUTES
========================= */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/expenses", require("./routes/expenses"));

/* =========================
   4. EXPORT FOR VERCEL
========================= */
module.exports = app;
