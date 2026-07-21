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
app.use("/api/vendors", require("./routes/vendors"));
app.use("/api/customers", require("./routes/customers"));
app.use("/api/cash", require("./routes/cash"));
app.use("/api/ai", require("./routes/ai"));

/* =========================
   4. LOCAL DEV SERVER
   Vercel imports the exported app directly for its serverless function
   (require.main !== module in that case), so this only binds a port when
   running `node server.js` / `npm start` locally.
========================= */
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server listening on http://localhost:${PORT}`));
}

/* =========================
   5. EXPORT FOR VERCEL
========================= */
module.exports = app;
