require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

// 1. SECURITY & CORS SETUP
app.use(cors({
  // FIX: We are using an ARRAY to allow both versions of your Vercel URL
  origin: [
    "https://velocity-tours-fsjn-bhavay-vasudevs-projects.vercel.app",
    "https://velocity-tours-git-main-bhavay-vasudevs-projects.vercel.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

module.exports = app;