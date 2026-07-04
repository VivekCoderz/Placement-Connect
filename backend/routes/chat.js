const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat");
const { jwtVerify } = require("../middleware/jwtVerify");

router.get("/contacts", jwtVerify, chatController.getContacts);
router.get("/messages/:receiverId", jwtVerify, chatController.getMessages);

module.exports = router;
