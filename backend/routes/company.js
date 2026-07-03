const express = require("express");
const router = express.Router();
const companyController = require("../controllers/company");
const { jwtVerify, authorizeRoles, getAssociatedDetails } = require("../middleware/jwtVerify");

router.post("/jobs", jwtVerify, authorizeRoles("recruiter"), getAssociatedDetails, companyController.postJob);
router.get("/applications/:jobId", jwtVerify, authorizeRoles("recruiter"), getAssociatedDetails, companyController.getApplications);

module.exports = router;
