const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  updateMe,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { isAuthenticated } = require("../middleware/authMiddleware");
const rateLimit = require("../middleware/rateLimitMiddleware");
const { getCsrfToken } = require("../middleware/csrfMiddleware");

const authLimiter = rateLimit({ name: "auth", windowMs: 15 * 60 * 1000, max: 20 });
const passwordLimiter = rateLimit({ name: "password", windowMs: 15 * 60 * 1000, max: 5 });

router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.post("/logout", logoutUser);
router.get("/csrf-token", getCsrfToken);
router.get("/me", isAuthenticated, getMe);
router.put("/me", isAuthenticated, updateMe);

// PASSWORD RESET
router.post("/forgot-password", passwordLimiter, forgotPassword);
router.post("/reset-password/:token", passwordLimiter, resetPassword);

module.exports = router;
