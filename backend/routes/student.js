const router = require("express").Router();
const studentController = require("../controllers/student");
const { jwtVerify, authorizeRoles } = require("../middleware/jwtVerify");
const { uploadResume, uploadImage } = require("../middleware/upload");

const studentOnly = [jwtVerify, authorizeRoles("student")];

// SPEC ENDPOINTS
router.post("/profile", ...studentOnly, studentController.updateProfile); // Create/Update profile
router.put("/resume", ...studentOnly, uploadResume.single("resume"), studentController.uploadResume); // Upload resume (PDF, 5 MB)

// SKELETON & EXTENSION ENDPOINTS
router.get("/profile", ...studentOnly, studentController.getProfile);
router.put("/profile", ...studentOnly, studentController.updateProfile);
router.post("/uploadResume", ...studentOnly, uploadResume.single("resume"), studentController.uploadResume);
router.post("/uploadProfilePicture", ...studentOnly, uploadImage.single("image"), studentController.uploadProfilePicture);
router.post("/uploadProject", ...studentOnly, studentController.uploadProject);
router.put("/updateSkills", ...studentOnly, studentController.updateSkills);
router.put("/updateCgpa", ...studentOnly, studentController.updateCgpa);
router.put("/updateBranchYearRollNumber", ...studentOnly, studentController.updateBranchYearRollNumber);
router.put("/updateEmailName", ...studentOnly, studentController.updateEmailName);
router.put("/updatePhoneNumber", ...studentOnly, studentController.updatePhoneNumber);
router.put("/updatePassword", ...studentOnly, studentController.updatePassword);

module.exports = router;
