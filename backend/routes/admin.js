const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin");
const { jwtVerify, authorizeRoles } = require("../middleware/jwtVerify");
const validate = require("../middleware/validate");
const { createStaffSchema, academicUpdateSchema } = require("../validators/schemas");

// Staff account creation (admin / placementCell) - admin only
router.post("/users", jwtVerify, authorizeRoles("admin"), validate(createStaffSchema), adminController.createStaffUser);

// Verified academic record updates (CGPA, branch, year, roll number) - TPO / admin only
router.put(
  "/students/:studentId/academic",
  jwtVerify,
  authorizeRoles("admin", "placementCell"),
  validate(academicUpdateSchema),
  adminController.updateStudentAcademic,
);

router.post("/companies/approve", jwtVerify, authorizeRoles("admin"), adminController.approveCompany);
router.post("/companies/reject", jwtVerify, authorizeRoles("admin"), adminController.rejectCompany);
router.get("/companies", jwtVerify, authorizeRoles("admin"), adminController.getCompanies);
router.get("/students", jwtVerify, authorizeRoles("admin", "placementCell"), adminController.getStudents);
router.post("/users/:userId/toggle-active", jwtVerify, authorizeRoles("admin"), adminController.toggleUserStatus);
router.post("/jobs/:jobId/toggle-status", jwtVerify, authorizeRoles("admin"), adminController.toggleJobStatus);
router.get("/stats", jwtVerify, authorizeRoles("admin"), adminController.getAdminStats);

module.exports = router;
