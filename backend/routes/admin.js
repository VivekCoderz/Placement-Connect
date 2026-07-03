const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin");
const { jwtVerify, authorizeRoles } = require("../middleware/jwtVerify");

router.post("/companies/approve", jwtVerify, authorizeRoles("admin"), adminController.approveCompany);
router.get("/companies", jwtVerify, authorizeRoles("admin"), adminController.getCompanies);
router.get("/students", jwtVerify, authorizeRoles("admin", "placementCell"), adminController.getStudents);

module.exports = router;
