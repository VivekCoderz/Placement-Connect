const Notification = require("../models/notification");
const ErrorWrapper = require("../utils/ErrorWrapper");
const ErrorHandler = require("../utils/ErrorHandle");

// Get notifications (chronological)
module.exports.getNotifications = ErrorWrapper(async (req, res, next) => {
  const userId = String(req.params.userId || req.user.id);

  // Security: users read their own notifications; only an admin may read someone else's.
  if (String(req.user.id) !== userId && req.user.role !== "admin") {
    throw new ErrorHandler(403, "Access Denied: You are not authorized to view these notifications");
  }

  // Latest 100 are enough for the bell and the notifications page.
  const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(100);

  return res.status(200).json({ notifications });
});

// Mark single notification as read
module.exports.markAsRead = ErrorWrapper(async (req, res, next) => {
  const { id } = req.params;

  const notification = await Notification.findById(id);
  if (!notification) {
    throw new ErrorHandler(404, "Notification not found");
  }

  // Security: verify notification belongs to requester
  if (notification.userId.toString() !== req.user.id.toString()) {
    throw new ErrorHandler(403, "Access Denied: You do not own this notification");
  }

  notification.read = true;
  await notification.save();

  return res.status(200).json({
    message: "Notification marked as read",
    notification,
  });
});

// Delete one of my notifications
module.exports.deleteNotification = ErrorWrapper(async (req, res, next) => {
  const result = await Notification.deleteOne({ _id: req.params.id, userId: req.user.id });
  if (result.deletedCount === 0) {
    throw new ErrorHandler(404, "Notification not found");
  }
  return res.status(200).json({ message: "Notification deleted" });
});

// Delete all of my notifications
module.exports.deleteAllNotifications = ErrorWrapper(async (req, res, next) => {
  await Notification.deleteMany({ userId: req.user.id });
  return res.status(200).json({ message: "All notifications deleted" });
});

// Mark all notifications as read for logged in user
module.exports.markAllAsRead = ErrorWrapper(async (req, res, next) => {
  const userId = req.user.id;

  await Notification.updateMany({ userId, read: false }, { read: true });

  return res.status(200).json({ message: "All notifications marked as read" });
});
