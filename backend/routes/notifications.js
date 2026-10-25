const express = require("express");
const Notification = require("../models/Notification");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Get all notifications for current user
router.get("/", requireAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("sender", "firstName lastName headline location avatar")
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch notifications." });
  }
});

// Mark one as read
router.patch("/:id/read", requireAuth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    res.json({ notification });
  } catch (error) {
    res.status(500).json({ message: "Could not mark notification as read." });
  }
});

// Mark all as read
router.post("/read-all", requireAuth, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );

    res.json({ message: "All notifications marked as read." });
  } catch (error) {
    res.status(500).json({ message: "Could not update notifications." });
  }
});

// Delete a notification
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });

    res.json({ message: "Notification removed." });
  } catch (error) {
    res.status(500).json({ message: "Could not delete notification." });
  }
});

module.exports = router;
