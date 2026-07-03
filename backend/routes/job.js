const express = require("express");
const router = express.Router();
const jobController = require("../controllers/job");
const { jwtVerify, authorizeRoles } = require("../middleware/jwtVerify");

router.get("/", jwtVerify, jobController.getJobs);
router.get("/:id", jwtVerify, jobController.getJobById);
router.post("/:id/apply", jwtVerify, authorizeRoles("student"), jobController.applyJob);

module.exports = router;
