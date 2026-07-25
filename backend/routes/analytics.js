const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics");
const { jwtVerify, authorizeRoles } = require("../middleware/jwtVerify");

router.get("/placement-stats", jwtVerify, analyticsController.getPlacementStats);
router.get("/detailed-stats", jwtVerify, authorizeRoles("admin", "placementCell"), analyticsController.getDetailedStats);

module.exports = router;
