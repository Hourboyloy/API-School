const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Target user for notification
  usernameMe: { type: String, required: true }, // Username of the person triggering the notification
  message: { type: String, required: true }, // Notification message content
  link: { type: String, required: true }, // The URL or path to navigate to when the notification is clicked
  commentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
    required: true,
  }, // Comment that triggered the notification
  userRead: { type: Boolean, default: false }, // Status if the user has read the notification
  adminRead: { type: Boolean, default: false }, // Status if the admin has read the notification
  createdAt: { type: Date, default: Date.now }, // Timestamp when the notification is created
});

const Notification = mongoose.model("notifications", notificationSchema);
module.exports = Notification;
