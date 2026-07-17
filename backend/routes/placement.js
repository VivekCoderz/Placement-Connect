const express = require("express");
const router = express.Router();
const multer = require("multer");
const placementController = require("../controllers/placement");
const { jwtVerify, authorizeRoles } = require("../middleware/jwtVerify");

const memoryStorage = multer.memoryStorage();
const uploadMemory = multer({ storage: memoryStorage });

// Upload shortlist CSV - accessible by placementCell, recruiters, or admin
router.post(
  "/shortlist/upload",
  jwtVerify,
  authorizeRoles("placementCell", "recruiter", "company", "admin"),
  uploadMemory.single("file"),
  placementController.uploadShortlist
);

// Get all Drives & Applications - accessible by placementCell and admin
router.get("/drives", jwtVerify, authorizeRoles("placementCell", "admin"), placementController.getDrives);
router.get("/applications", jwtVerify, authorizeRoles("placementCell", "admin"), placementController.getApplications);
router.get("/shortlists", jwtVerify, authorizeRoles("placementCell", "admin"), placementController.getShortlists);
router.post("/shortlist/:id/schedule", jwtVerify, authorizeRoles("placementCell", "admin"), placementController.scheduleShortlist);

// Send round schedule notification to students - accessible by placementCell and admin
router.post(
  "/notify",
  jwtVerify,
  authorizeRoles("placementCell", "admin"),
  placementController.notifyStudents
);

module.exports = router;
