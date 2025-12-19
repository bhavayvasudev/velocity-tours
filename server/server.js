require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

// 1. SECURITY MIDDLEWARE
// Enable Credentials so cookies can be sent back and forth
app.use(cors({
  origin: function (origin, callback) {
    // This function allows ANY domain to connect while keeping cookies working
    return callback(null, true);
  },
  credentials: true,               // <--- CRITICAL for cookies
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(cookieParser());

// 2. DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log(err));

// 3. ROUTES
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/auth', require('./routes/auth'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = app;