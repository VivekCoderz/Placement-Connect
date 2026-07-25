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

// Manual candidate evaluation results marking
router.post("/jobs/:jobId/rounds/:roundId/manual-results", jwtVerify, authorizeRoles("recruiter", "company"), getAssociatedDetails, companyController.manualRoundResults);

// AI decision override
router.post("/applications/:appId/override", jwtVerify, authorizeRoles("recruiter", "company"), getAssociatedDetails, companyController.overrideDecision);

// Dynamic hiring rounds management
router.get("/jobs/:jobId/rounds", jwtVerify, authorizeRoles("recruiter", "company", "student"), getAssociatedDetails, companyController.getRounds);
router.post("/jobs/:jobId/rounds", jwtVerify, authorizeRoles("recruiter", "company"), getAssociatedDetails, companyController.createRound);
router.put("/jobs/rounds/:roundId", jwtVerify, authorizeRoles("recruiter", "company"), getAssociatedDetails, companyController.updateRound);
router.delete("/jobs/rounds/:roundId", jwtVerify, authorizeRoles("recruiter", "company"), getAssociatedDetails, companyController.deleteRound);

router.get("/offer-template", jwtVerify, authorizeRoles("recruiter", "company"), getAssociatedDetails, companyController.getOfferTemplate);
router.put("/offer-template", jwtVerify, authorizeRoles("recruiter", "company"), getAssociatedDetails, companyController.updateOfferTemplate);

module.exports = router;
