const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { signToken, setAuthCookie, requireAuth } = require("../middleware/auth");

const router = express.Router();

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

router.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, password, headline, location } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "First name, last name, email and password are required." });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must contain at least 8 characters." });
    }

    const normalizedEmail = normalizeEmail(email);
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      passwordHash,
      headline: headline?.trim() || undefined,
      location: location?.trim() || undefined
    });

    const token = signToken(user._id.toString());
    setAuthCookie(res, token);

    res.status(201).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to create account right now." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = signToken(user._id.toString());
    setAuthCookie(res, token);

    user.passwordHash = undefined;
    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to log in right now." });
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
  res.json({ message: "Logged out successfully." });
});

router.get("/me", requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
