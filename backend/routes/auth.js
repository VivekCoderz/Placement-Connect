const express = require("express");
const AuthController = require("../controllers/auth");
const { jwtVerify } = require("../middleware/jwtVerify");
const router = express.Router();

router.post("/register", AuthController.postRegister);
router.post("/login", AuthController.postLogin);
router.post("/logout", AuthController.postLogout);
router.get("/profile", jwtVerify, AuthController.getProfile);

module.exports = router;
