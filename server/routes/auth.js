const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require("bcryptjs");
const rateLimit = require('express-rate-limit');
const { verifyToken, adminOnly } = require("../middleware/authMiddleware");

// ==========================================
// 1. DEFINE LIMITER (This was missing!)
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
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '15m' });
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
    // Check User
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "User not found." });

    // Check Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Wrong password." });

    // Generate Tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none', // Crucial for Vercel-to-Vercel communication
      maxAge: 3600000 
    });

    res.json({ accessToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
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
  res.clearCookie('refreshToken');
  res.json({ message: "Logged out" });
});

router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: "Not authenticated" });
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refreshSecret123');
    const accessToken = generateAccessToken(decoded.id);
    res.json({ accessToken });
  } catch (err) {
    res.status(403).json({ message: "Invalid refresh token" });
  }
});

module.exports = router;