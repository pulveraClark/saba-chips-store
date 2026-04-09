const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  logoutUser,
  getMe
} = require("../controllers/authController");
const { isAuthenticated } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser); // Changed to POST for security
router.get("/me", isAuthenticated, getMe);

module.exports = router;