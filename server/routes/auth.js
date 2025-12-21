const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require("bcryptjs");
const rateLimit = require('express-rate-limit');
const { verifyToken, adminOnly } = require("../middleware/authMiddleware");

// ==========================================
// 1. DEFINE LIMITER
// ==========================================
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 50, 
  message: { message: "Too many login attempts. Please try again after 15 minutes." }
});

// ==========================================
// 2. HELPER FUNCTIONS
// ==========================================
const generateAccessToken = (id) => {
  // ✅ FIX 1: Session set to 24 Hours (was 15m)
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '24h' });
};
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'refreshSecret123', { expiresIn: '7d' });
};

// ==========================================
// 3. LOGIN ROUTE
// ==========================================
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "User not found." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Wrong password." });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // FIX: Sending the refreshToken as the persistent cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,      // Must be true for Vercel/HTTPS
      sameSite: 'none',  // Must be 'none' for Cross-Domain
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // ✅ FIX 2: Changed 'accessToken' to 'token' to match frontend
    res.json({ 
      token: accessToken, 
      user: { id: user._id, name: user.name, email: user.email, role: user.role } 
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// 4. REGISTER (Create Staff - Admin Only)
// ==========================================
router.post("/register", verifyToken, adminOnly, async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      role: req.body.role || "staff"
    });

    await newUser.save();
    res.status(201).json({ message: "Account created successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Error creating user" });
  }
});

// ==========================================
// 5. GET ALL USERS (Admin Only)
// ==========================================
router.get("/users", verifyToken, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users" });
  }
});

// ==========================================
// 6. DELETE USER (Admin Only)
// ==========================================
router.delete("/users/:id", verifyToken, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting user" });
  }
});

// ==========================================
// 7. LOGOUT & REFRESH
// ==========================================
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  });
  res.json({ message: "Logged out" });
});

// ✅ FIX 3: Restored Refresh Route (Safe to keep)
router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: "Not authenticated" });
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refreshSecret123');
    const accessToken = generateAccessToken(decoded.id);
    // Updated this to 'token' as well for consistency
    res.json({ token: accessToken });
  } catch (err) {
    res.status(403).json({ message: "Invalid refresh token" });
  }
});

module.exports = router;