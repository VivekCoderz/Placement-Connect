const express = require("express");
const router = express.Router();
const applicationsController = require("../controllers/applications");
const { jwtVerify, authorizeRoles } = require("../middleware/jwtVerify");
const upload = require("../middleware/upload");

// Get logged-in student's applications
router.get(
  "/my-applications",
  jwtVerify,
  authorizeRoles("student"),
  applicationsController.getMyApplications
);

// Update application status and upload offer letters (accessible by recruiter, placement cell, admin)
router.put(
  "/:id/status",
  jwtVerify,
  authorizeRoles("recruiter", "placementCell", "admin"),
  upload.single("offerLetter"),
  applicationsController.updateStatus
);

module.exports = router;
