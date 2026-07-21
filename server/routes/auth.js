const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const rateLimit = require('express-rate-limit');
const { OAuth2Client } = require('google-auth-library');
const { verifyToken, adminOnly } = require("../middleware/authMiddleware");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
// 3. GOOGLE LOGIN (only login method)
//
// Security note: this app is an internal financial tool with admin-gated
// account creation (see /register below). Google sign-in intentionally does
// NOT auto-provision new accounts — it only links/authenticates an email
// that an admin has already created via Team Management, so "Continue with
// Google" can't be used as an open self-serve signup funnel.
//
// Migration note: pre-existing accounts (created back when this app used
// hardcoded password auth) have no googleId yet. The first time a matching
// email signs in with Google, we link that Google account to the existing
// user document instead of creating a duplicate — same _id, so every
// booking/vendor/expense/etc relation tied to that user stays intact.
//
// Admin bootstrap: this app is provisioned with exactly one admin account.
// If a Google sign-in doesn't match any user by googleId or email, and
// there is exactly one admin account that has never been linked to a
// Google identity, that Google account is linked to it and becomes the
// owner. This only fires once — after linking, the admin has a googleId
// and this path no longer matches. Optionally set ADMIN_BOOTSTRAP_EMAIL to
// restrict which email is allowed to claim it.
// ==========================================
router.post('/google', loginLimiter, async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ message: "Missing Google credential." });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email } = payload;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      const bootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL;
      if (!bootstrapEmail || bootstrapEmail === email) {
        const unlinkedAdmins = await User.find({ role: 'admin', googleId: { $exists: false } });
        if (unlinkedAdmins.length === 1) {
          user = unlinkedAdmins[0];
        }
      }
    }

    if (!user) {
      return res.status(403).json({ message: "No account found for this email. Contact your admin to get access." });
    }

    if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      token: accessToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(401).json({ message: "Google sign-in failed. Please try again." });
  }
});

// ==========================================
// 4. REGISTER (Authorize Staff - Admin Only)
// Creates a placeholder account an admin pre-authorizes by email; the
// person then signs in themselves via "Continue with Google", which links
// their Google identity to this record on first login.
// ==========================================
router.post("/register", verifyToken, adminOnly, async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      role: req.body.role || "staff"
    });

    await newUser.save();
    res.status(201).json({ message: "Account authorized. They can now sign in with Google." });
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