const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics");
const { jwtVerify } = require("../middleware/jwtVerify");

router.get("/placement-stats", jwtVerify, analyticsController.getPlacementStats);

module.exports = router;
