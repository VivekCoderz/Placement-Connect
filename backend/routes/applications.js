const express = require("express");
const router = express.Router();
const applicationsController = require("../controllers/applications");
const { jwtVerify, authorizeRoles, getAssociatedDetails } = require("../middleware/jwtVerify");
const { uploadOfferLetter } = require("../middleware/upload");
const { requireApplicationOwner } = require("../utils/ownership");

// Get logged-in student's applications
router.get(
  "/my-applications",
  jwtVerify,
  authorizeRoles("student"),
  applicationsController.getMyApplications
);

// Student: withdraw an application, or accept / decline an approved offer
router.put("/:id/withdraw", jwtVerify, authorizeRoles("student"), applicationsController.withdrawApplication);
router.put("/:id/offer-response", jwtVerify, authorizeRoles("student"), applicationsController.respondToOffer);

// Update application status and upload offer letters (owning company, placement cell, admin)
router.put(
  "/:id/status",
  jwtVerify,
  authorizeRoles("company", "placementCell", "admin"),
  getAssociatedDetails,
  requireApplicationOwner("id"),
  uploadOfferLetter.single("offerLetter"),
  applicationsController.updateStatus
);

router.put(
  "/:id/issue-offer",
  jwtVerify,
  authorizeRoles("company", "admin"),
  getAssociatedDetails,
  requireApplicationOwner("id"),
  uploadOfferLetter.single("offerLetter"),
  applicationsController.issueOffer
);

router.put(
  "/:id/approve-offer",
  jwtVerify,
  authorizeRoles("placementCell", "admin"),
  applicationsController.approveOffer
);

router.put(
  "/:id/reject-offer",
  jwtVerify,
  authorizeRoles("placementCell", "admin"),
  applicationsController.rejectOffer
);

module.exports = router;
