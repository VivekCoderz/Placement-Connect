const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics");
const { jwtVerify, authorizeRoles } = require("../middleware/jwtVerify");

// Not used by the current frontend; staff only.
router.get("/placement-stats", jwtVerify, authorizeRoles("admin", "placementCell"), analyticsController.getPlacementStats);
router.get("/detailed-stats", jwtVerify, authorizeRoles("admin", "placementCell"), analyticsController.getDetailedStats);

module.exports = router;
