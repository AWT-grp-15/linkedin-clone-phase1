const Notification = require("../models/Notification");

async function createNotification({ recipient, sender, type, message, link }) {
  try {
    if (!recipient || !sender) return null;
    if (String(recipient) === String(sender)) return null; // Don't notify yourself

    return await Notification.create({
      recipient,
      sender,
      type,
      message,
      link: link || "/"
    });
  } catch (error) {
    console.error("Failed to create notification:", error.message);
    return null;
  }
}

module.exports = { createNotification };
