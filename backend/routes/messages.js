const express = require("express");
const Message = require("../models/Message");
const User = require("../models/User");
const Connection = require("../models/Connection");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Get list of conversations
router.get("/conversations", requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Find all distinct users we sent to or received messages from
    const sent = await Message.find({ sender: currentUserId }).distinct("recipient");
    const received = await Message.find({ recipient: currentUserId }).distinct("sender");

    // Also include accepted connections even if no messages yet!
    const connections = await Connection.find({
      status: "accepted",
      $or: [{ sender: currentUserId }, { receiver: currentUserId }]
    });

    const connectionUserIds = connections.map((c) =>
      String(c.sender) === String(currentUserId) ? c.receiver : c.sender
    );

    const allContactIds = Array.from(new Set([
      ...sent.map(String),
      ...received.map(String),
      ...connectionUserIds.map(String)
    ]));

    const contacts = await User.find({ _id: { $in: allContactIds } })
      .select("firstName lastName headline avatar");

    // For each contact, find the most recent message
    const conversations = await Promise.all(
      contacts.map(async (contact) => {
        const lastMessage = await Message.findOne({
          $or: [
            { sender: currentUserId, recipient: contact._id },
            { sender: contact._id, recipient: currentUserId }
          ]
        }).sort({ createdAt: -1 });

        const unreadCount = await Message.countDocuments({
          sender: contact._id,
          recipient: currentUserId,
          read: false
        });

        return {
          contact,
          lastMessage: lastMessage ? lastMessage.text : "Connected! Say hello.",
          lastMessageTime: lastMessage ? lastMessage.createdAt : contact.createdAt,
          unreadCount
        };
      })
    );

    // Sort by latest message first
    conversations.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

    res.json({ conversations });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch conversations." });
  }
});

// Get message history between current user and target user
router.get("/:userId", requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: targetUserId },
        { sender: targetUserId, recipient: currentUserId }
      ]
    }).sort({ createdAt: 1 });

    // Mark received messages as read
    await Message.updateMany(
      { sender: targetUserId, recipient: currentUserId, read: false },
      { read: true }
    );

    const targetUser = await User.findById(targetUserId).select("firstName lastName headline avatar");

    res.json({ messages, targetUser });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch messages." });
  }
});

// Send a message
router.post("/:userId", requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.userId;
    const text = String(req.body.text || "").trim();

    if (!text) {
      return res.status(400).json({ message: "Message cannot be empty." });
    }

    if (String(currentUserId) === String(targetUserId)) {
      return res.status(400).json({ message: "Cannot message yourself." });
    }

    const message = await Message.create({
      sender: currentUserId,
      recipient: targetUserId,
      text
    });

    res.status(201).json({ message });
  } catch (error) {
    res.status(500).json({ message: "Could not send message." });
  }
});

module.exports = router;
