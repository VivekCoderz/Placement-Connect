const express = require("express");
const AuthController = require("../controllers/auth");
const { jwtVerify } = require("../middleware/jwtVerify");
const router = express.Router();

router.post("/register", AuthController.postRegister);
router.post("/login", AuthController.postLogin);
router.post("/logout", AuthController.postLogout);
router.get("/me", jwtVerify, AuthController.me);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password/:token", AuthController.resetPassword);
router.put("/change-password", jwtVerify, AuthController.changePassword);

module.exports = router;
