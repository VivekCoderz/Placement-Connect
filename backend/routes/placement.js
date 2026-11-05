const express = require("express");
const router = express.Router();
const placementController = require("../controllers/placement");
const { jwtVerify, authorizeRoles, getAssociatedDetails } = require("../middleware/jwtVerify");
const { uploadCsv } = require("../middleware/upload");

// Upload shortlist CSV - placementCell/admin for any job; a company only for its own jobs
// (ownership is enforced in the controller once the multipart body, which carries jobId, is parsed).
router.post(
  "/shortlist/upload",
  jwtVerify,
  authorizeRoles("placementCell", "company", "admin"),
  getAssociatedDetails,
  uploadCsv.single("file"),
  placementController.uploadShortlist
);

// Get all Drives & Applications - accessible by placementCell and admin
router.get("/drives", jwtVerify, authorizeRoles("placementCell", "admin"), placementController.getDrives);
router.get("/applications", jwtVerify, authorizeRoles("placementCell", "admin"), placementController.getApplications);
router.get("/shortlists", jwtVerify, authorizeRoles("placementCell", "admin"), placementController.getShortlists);
router.post("/shortlist/:id/schedule", jwtVerify, authorizeRoles("placementCell", "admin"), placementController.scheduleShortlist);

// Result approvals endpoints
router.get("/result-approvals", jwtVerify, authorizeRoles("placementCell", "admin"), placementController.getResultApprovals);
router.post("/result-approvals/:id/approve", jwtVerify, authorizeRoles("placementCell", "admin"), placementController.approveResult);
router.post("/result-approvals/:id/reject", jwtVerify, authorizeRoles("placementCell", "admin"), placementController.rejectResult);

// Send round schedule notification to students - accessible by placementCell and admin
router.post(
  "/notify",
  jwtVerify,
  authorizeRoles("placementCell", "admin"),
  placementController.notifyStudents
);

module.exports = router;
