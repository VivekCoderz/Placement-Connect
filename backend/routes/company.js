const express = require("express");
const router = express.Router();
const companyController = require("../controllers/company");
const { jwtVerify, authorizeRoles, getAssociatedDetails } = require("../middleware/jwtVerify");
const { uploadCsv } = require("../middleware/upload");
const validate = require("../middleware/validate");
const { requireJobOwner } = require("../utils/ownership");
const {
  createRoundSchema,
  updateRoundSchema,
  manualResultsSchema,
  overrideSchema,
} = require("../validators/schemas");

// All job/application/round handlers below enforce ownership (see utils/ownership.js).
const companyOnly = [jwtVerify, authorizeRoles("company"), getAssociatedDetails];

router.post("/jobs", ...companyOnly, companyController.postJob);
router.get("/applications/:jobId", ...companyOnly, companyController.getApplications);
router.post("/propose-schedule", ...companyOnly, companyController.proposeSchedule);
router.post("/submit-shortlist", ...companyOnly, companyController.submitShortlist);
router.post("/applications/bulk-action", ...companyOnly, companyController.bulkAction);
router.post("/jobs/:jobId/approve-selection", ...companyOnly, companyController.approveSelection);

router.post("/jobs/:jobId/ats-shortlist", ...companyOnly, companyController.atsShortlist);
router.post(
  "/jobs/:jobId/upload-results",
  ...companyOnly,
  requireJobOwner("jobId"),
  uploadCsv.single("file"),
  companyController.uploadRoundResults,
);

// Manual candidate evaluation results marking
router.post(
  "/jobs/:jobId/rounds/:roundId/manual-results",
  ...companyOnly,
  validate(manualResultsSchema),
  companyController.manualRoundResults,
);

// AI decision override
router.post("/applications/:appId/override", ...companyOnly, validate(overrideSchema), companyController.overrideDecision);

// Dynamic hiring rounds management
router.get(
  "/jobs/:jobId/rounds",
  jwtVerify,
  authorizeRoles("company", "student", "placementCell", "admin"),
  getAssociatedDetails,
  companyController.getRounds,
);
router.post("/jobs/:jobId/rounds", ...companyOnly, validate(createRoundSchema), companyController.createRound);
router.put("/jobs/rounds/:roundId", ...companyOnly, validate(updateRoundSchema), companyController.updateRound);
router.delete("/jobs/rounds/:roundId", ...companyOnly, companyController.deleteRound);

router.get("/offer-template", ...companyOnly, companyController.getOfferTemplate);
router.put("/offer-template", ...companyOnly, companyController.updateOfferTemplate);

module.exports = router;
