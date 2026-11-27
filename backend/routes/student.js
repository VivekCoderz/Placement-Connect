const router = require("express").Router();
const studentController = require("../controllers/student");
const { jwtVerify, authorizeRoles } = require("../middleware/jwtVerify");
const { uploadResume, uploadImage } = require("../middleware/upload");
const validate = require("../middleware/validate");
const { profileUpdateSchema, changePasswordSchema } = require("../validators/schemas");
const AuthController = require("../controllers/auth");
const { authLimiter } = require("../middleware/rateLimit");

const studentOnly = [jwtVerify, authorizeRoles("student")];

// SPEC ENDPOINTS
router.post("/profile", ...studentOnly, validate(profileUpdateSchema), studentController.updateProfile); // Create/Update profile
router.put("/resume", ...studentOnly, uploadResume.single("resume"), studentController.uploadResume); // Upload resume (PDF, 5 MB)

// SKELETON & EXTENSION ENDPOINTS
router.get("/profile", ...studentOnly, studentController.getProfile);
router.put("/profile", ...studentOnly, validate(profileUpdateSchema), studentController.updateProfile);
router.post("/uploadResume", ...studentOnly, uploadResume.single("resume"), studentController.uploadResume);
router.delete("/resume", ...studentOnly, studentController.deleteResume);
router.post("/uploadProfilePicture", ...studentOnly, uploadImage.single("image"), studentController.uploadProfilePicture);
router.delete("/profilePicture", ...studentOnly, studentController.deleteProfilePicture);
router.post("/uploadProject", ...studentOnly, studentController.uploadProject);
router.put("/updateSkills", ...studentOnly, studentController.updateSkills);
router.put("/updateCgpa", ...studentOnly, studentController.updateCgpa);
router.put("/updateBranchYearRollNumber", ...studentOnly, studentController.updateBranchYearRollNumber);
router.put("/updateEmailName", ...studentOnly, studentController.updateEmailName);
router.put("/updatePhoneNumber", ...studentOnly, studentController.updatePhoneNumber);
// Same rules as PUT /api/auth/change-password (policy, rate limit, session revocation).
router.put("/updatePassword", authLimiter, ...studentOnly, validate(changePasswordSchema), AuthController.changePassword);

module.exports = router;
