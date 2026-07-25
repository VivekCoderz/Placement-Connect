const express = require("express");
const router = express.Router();
const multer = require("multer");
const companyController = require("../controllers/company");
const { jwtVerify, authorizeRoles, getAssociatedDetails } = require("../middleware/jwtVerify");

const memoryStorage = multer.memoryStorage();
const uploadMemory = multer({ storage: memoryStorage });

router.post("/jobs", jwtVerify, authorizeRoles("recruiter", "company"), getAssociatedDetails, companyController.postJob);
router.get("/applications/:jobId", jwtVerify, authorizeRoles("recruiter", "company"), getAssociatedDetails, companyController.getApplications);
router.post("/propose-schedule", jwtVerify, authorizeRoles("recruiter", "company"), getAssociatedDetails, companyController.proposeSchedule);
router.post("/submit-shortlist", jwtVerify, authorizeRoles("recruiter", "company"), getAssociatedDetails, companyController.submitShortlist);

router.post("/jobs/:jobId/ats-shortlist", jwtVerify, authorizeRoles("recruiter", "company"), getAssociatedDetails, companyController.atsShortlist);
router.post("/jobs/:jobId/upload-results", jwtVerify, authorizeRoles("recruiter", "company"), getAssociatedDetails, uploadMemory.single("file"), companyController.uploadRoundResults);

router.get("/offer-template", jwtVerify, authorizeRoles("recruiter", "company"), getAssociatedDetails, companyController.getOfferTemplate);
router.put("/offer-template", jwtVerify, authorizeRoles("recruiter", "company"), getAssociatedDetails, companyController.updateOfferTemplate);

module.exports = router;
