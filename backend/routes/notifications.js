const express = require("express");
const router = express.Router();
const notificationsController = require("../controllers/notifications");
const { jwtVerify } = require("../middleware/jwtVerify");

router.get("/", jwtVerify, notificationsController.getNotifications);
router.get("/:userId", jwtVerify, notificationsController.getNotifications);
router.put("/read-all", jwtVerify, notificationsController.markAllAsRead);
router.put("/:id/read", jwtVerify, notificationsController.markAsRead);

module.exports = router;
