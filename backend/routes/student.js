const router = require("express").Router();
const studentController = require("../controllers/student");
const { jwtVerify } = require("../middleware/jwtVerify");
const upload = require("../middleware/upload");

// SPEC ENDPOINTS
router.post("/profile", jwtVerify, studentController.updateProfile); // Create/Update profile
router.put("/resume", jwtVerify, upload.single("resume"), studentController.uploadResume); // Upload resume

// SKELETON & EXTENSION ENDPOINTS
router.get("/profile", jwtVerify, studentController.getProfile);
router.put("/profile", jwtVerify, studentController.updateProfile);
router.post("/uploadResume", jwtVerify, upload.single("resume"), studentController.uploadResume);
router.post("/uploadProfilePicture", jwtVerify, upload.single("image"), studentController.uploadProfilePicture);
router.post("/uploadProject", jwtVerify, studentController.uploadProject);
router.put("/updateSkills", jwtVerify, studentController.updateSkills);
router.put("/updateCgpa", jwtVerify, studentController.updateCgpa);
router.put("/updateBranchYearRollNumber", jwtVerify, studentController.updateBranchYearRollNumber);
router.put("/updateEmailName", jwtVerify, studentController.updateEmailName);
router.put("/updatePhoneNumber", jwtVerify, studentController.updatePhoneNumber);
router.put("/updatePassword", jwtVerify, studentController.updatePassword);

module.exports = router;