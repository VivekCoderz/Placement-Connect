const Notification = require("../models/notification");
const ErrorWrapper = require("../utils/ErrorWrapper");
const ErrorHandler = require("../utils/ErrorHandle");

// Get notifications (chronological)
module.exports.getNotifications = ErrorWrapper(async (req, res, next) => {
  const userId = req.params.userId || req.user.id;

  // Security: only allow the user themselves, or placementCell/admin to view notifications
  if (req.user.id !== userId && req.user.role !== "admin" && req.user.role !== "placementCell") {
    throw new ErrorHandler(403, "Access Denied: You are not authorized to view these notifications");
  }

  const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });

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

// Mark all notifications as read for logged in user
module.exports.markAllAsRead = ErrorWrapper(async (req, res, next) => {
  const userId = req.user.id;

  await Notification.updateMany({ userId, read: false }, { read: true });

  return res.status(200).json({ message: "All notifications marked as read" });
});
