const express = require("express");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.patch("/me", requireAuth, async (req, res) => {
  try {
    const allowed = ["firstName", "lastName", "headline", "location"];
    const updates = {};

    for (const key of allowed) {
      if (typeof req.body[key] === "string") {
        updates[key] = req.body[key].trim();
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    });

    res.json({ user });
  } catch (error) {
    res.status(400).json({ message: "Could not update profile." });
  }
});

router.get("/search", requireAuth, async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.json({ users: [] });

  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const users = await User.find({
    $or: [{ firstName: regex }, { lastName: regex }, { headline: regex }]
  })
    .select("firstName lastName headline location connections")
    .limit(20);

  res.json({ users });
});

module.exports = router;
