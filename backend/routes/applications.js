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
  authorizeRoles("recruiter", "company", "placementCell", "admin"),
  upload.single("offerLetter"),
  applicationsController.updateStatus
);

router.put(
  "/:id/issue-offer",
  jwtVerify,
  authorizeRoles("recruiter", "company", "admin"),
  upload.single("offerLetter"),
  applicationsController.issueOffer
);

router.put(
  "/:id/approve-offer",
  jwtVerify,
  authorizeRoles("placementCell", "admin"),
  applicationsController.approveOffer
);

router.put(
  "/:id/reject-offer",
  jwtVerify,
  authorizeRoles("placementCell", "admin"),
  applicationsController.rejectOffer
);

module.exports = router;
