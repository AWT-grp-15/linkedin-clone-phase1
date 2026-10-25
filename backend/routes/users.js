const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Connection = require("../models/Connection");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const Message = require("../models/Message");
const { requireAuth } = require("../middleware/auth");
const { createNotification } = require("../utils/notify");

const router = express.Router();

// Current user profile
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Update current user profile
router.patch("/me", requireAuth, async (req, res) => {
  try {
    const allowed = ["firstName", "lastName", "headline", "location", "about", "avatar", "theme"];
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

// Get another user's profile
router.get("/profile/:userId", requireAuth, async (req, res) => {
  try {
    const targetId = req.params.userId === "me" ? req.user._id : req.params.userId;
    const user = await User.findById(targetId).select("firstName lastName headline location about avatar connections createdAt");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Determine connection status with logged in user
    let connectionStatus = "none"; // 'none' | 'pending' | 'accepted' | 'received'
    let connectionId = null;

    if (String(user._id) !== String(req.user._id)) {
      const conn = await Connection.findOne({
        $or: [
          { sender: req.user._id, receiver: user._id },
          { sender: user._id, receiver: req.user._id }
        ]
      });

      if (conn) {
        connectionId = conn._id;
        if (conn.status === "accepted") {
          connectionStatus = "accepted";
        } else if (conn.status === "pending") {
          connectionStatus = String(conn.sender) === String(req.user._id) ? "pending" : "received";
        }
      }
    } else {
      connectionStatus = "self";
    }

    res.json({ user, connectionStatus, connectionId });
  } catch (error) {
    res.status(400).json({ message: "Could not load user profile." });
  }
});

// Search users
router.get("/search", requireAuth, async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.json({ users: [] });

  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const users = await User.find({
    _id: { $ne: req.user._id },
    $or: [{ firstName: regex }, { lastName: regex }, { headline: regex }]
  })
    .select("firstName lastName headline location avatar connections")
    .limit(10);

  res.json({ users });
});

// People you may know (suggestions)
router.get("/suggestions", requireAuth, async (req, res) => {
  try {
    // Find all users the current user already has a connection or pending request with
    const existingConnections = await Connection.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }]
    });

    const excludedIds = new Set(existingConnections.map((c) =>
      String(c.sender) === String(req.user._id) ? String(c.receiver) : String(c.sender)
    ));
    excludedIds.add(String(req.user._id));

    const suggestions = await User.find({
      _id: { $nin: Array.from(excludedIds) }
    })
      .select("firstName lastName headline location avatar connections")
      .limit(12);

    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ message: "Could not load suggestions." });
  }
});

// Send connection request
router.post("/:userId/connect", requireAuth, async (req, res) => {
  try {
    const senderId = req.user._id;
    const receiverId = req.params.userId;

    if (String(senderId) === String(receiverId)) {
      return res.status(400).json({ message: "You cannot connect with yourself." });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "User not found." });
    }

    const existing = await Connection.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    });

    if (existing) {
      if (existing.status === "accepted") {
        return res.status(400).json({ message: "You are already connected." });
      }
      if (existing.status === "pending") {
        return res.status(400).json({ message: "Connection request already exists." });
      }

      existing.sender = senderId;
      existing.receiver = receiverId;
      existing.status = "pending";
      await existing.save();

      await createNotification({
        recipient: receiverId,
        sender: senderId,
        type: "connection_request",
        message: `${req.user.firstName} ${req.user.lastName} sent you an invitation to connect.`,
        link: "/network"
      });

      return res.status(201).json({ message: "Connection request sent.", connection: existing });
    }

    const connection = await Connection.create({
      sender: senderId,
      receiver: receiverId,
      status: "pending"
    });

    await createNotification({
      recipient: receiverId,
      sender: senderId,
      type: "connection_request",
      message: `${req.user.firstName} ${req.user.lastName} sent you an invitation to connect.`,
      link: "/network"
    });

    res.status(201).json({ message: "Connection request sent.", connection });
  } catch (error) {
    res.status(500).json({ message: "Could not send connection request." });
  }
});

// Get received connection requests
router.get("/connection-requests", requireAuth, async (req, res) => {
  try {
    const requests = await Connection.find({
      receiver: req.user._id,
      status: "pending"
    })
      .populate("sender", "firstName lastName headline location avatar")
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: "Could not load connection requests." });
  }
});

// Accept connection request
router.post("/connections/:connectionId/accept", requireAuth, async (req, res) => {
  try {
    const connection = await Connection.findOne({
      _id: req.params.connectionId,
      receiver: req.user._id,
      status: "pending"
    });

    if (!connection) {
      return res.status(404).json({ message: "Connection request not found." });
    }

    connection.status = "accepted";
    await connection.save();

    await User.findByIdAndUpdate(connection.sender, { $inc: { connections: 1 } });
    await User.findByIdAndUpdate(connection.receiver, { $inc: { connections: 1 } });

    await createNotification({
      recipient: connection.sender,
      sender: req.user._id,
      type: "connection_accepted",
      message: `${req.user.firstName} ${req.user.lastName} accepted your invitation to connect.`,
      link: `/profile/${req.user._id}`
    });

    res.json({ message: "Connection accepted." });
  } catch (error) {
    res.status(500).json({ message: "Could not accept connection request." });
  }
});

// Reject/Ignore connection request
router.post("/connections/:connectionId/reject", requireAuth, async (req, res) => {
  try {
    const connection = await Connection.findOne({
      _id: req.params.connectionId,
      receiver: req.user._id,
      status: "pending"
    });

    if (!connection) {
      return res.status(404).json({ message: "Connection request not found." });
    }

    connection.status = "rejected";
    await connection.save();

    res.json({ message: "Connection request ignored." });
  } catch (error) {
    res.status(500).json({ message: "Could not reject connection request." });
  }
});

// Get all established connections
router.get("/connections", requireAuth, async (req, res) => {
  try {
    const connections = await Connection.find({
      status: "accepted",
      $or: [{ sender: req.user._id }, { receiver: req.user._id }]
    })
      .populate("sender", "firstName lastName headline location avatar")
      .populate("receiver", "firstName lastName headline location avatar")
      .sort({ updatedAt: -1 });

    const users = connections.map((conn) => {
      return String(conn.sender._id) === String(req.user._id) ? conn.receiver : conn.sender;
    });

    res.json({ connections: users });
  } catch (error) {
    res.status(500).json({ message: "Could not load connections." });
  }
});

// Change password
router.post("/change-password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Please provide current and new password." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long." });
    }

    const user = await User.findById(req.user._id).select("+passwordHash");
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!valid) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully." });
  } catch (error) {
    res.status(500).json({ message: "Could not change password." });
  }
});

// Delete account
router.delete("/account", requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    await Post.deleteMany({ author: userId });
    await Comment.deleteMany({ author: userId });
    await Connection.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] });
    await Notification.deleteMany({ $or: [{ recipient: userId }, { sender: userId }] });
    await Message.deleteMany({ $or: [{ sender: userId }, { recipient: userId }] });
    await User.findByIdAndDelete(userId);

    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });

    res.json({ message: "Account deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Could not delete account." });
  }
});

module.exports = router;
