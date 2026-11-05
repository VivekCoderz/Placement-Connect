const express = require("express");
const AuthController = require("../controllers/auth");
const { jwtVerify } = require("../middleware/jwtVerify");
const validate = require("../middleware/validate");
const { authLimiter, passwordResetLimiter } = require("../middleware/rateLimit");
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} = require("../validators/schemas");

const router = express.Router();

router.post("/register", authLimiter, validate(registerSchema), AuthController.postRegister);
router.post("/login", authLimiter, validate(loginSchema), AuthController.postLogin);
router.post("/logout", AuthController.postLogout);
router.get("/me", jwtVerify, AuthController.me);
router.post("/forgot-password", passwordResetLimiter, validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post("/reset-password/:token", passwordResetLimiter, validate(resetPasswordSchema), AuthController.resetPassword);
router.put("/change-password", jwtVerify, validate(changePasswordSchema), AuthController.changePassword);

module.exports = router;
