const express = require("express");
const reportsController = require("../controllers/reports");
const { jwtVerify, authorizeRoles, getAssociatedDetails } = require("../middleware/jwtVerify");

const router = express.Router();

// Owning recruiter, placement cell and admin (ownership is checked in the controller).
const access = [jwtVerify, authorizeRoles("company", "placementCell", "admin"), getAssociatedDetails];

router.get("/jobs/:jobId", ...access, reportsController.getDriveOverview);
router.get("/jobs/:jobId/list", ...access, reportsController.getDriveList);

module.exports = router;
