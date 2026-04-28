const express = require("express");
const router = express.Router();
const { isAuthenticated, isAdmin } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  createReview,
  getAdminReviews,
  getProductReviews,
} = require("../controllers/reviewController");

router.get("/admin", isAuthenticated, isAdmin, getAdminReviews);
router.get("/products/:productId", getProductReviews);
router.post("/", isAuthenticated, upload.single("image"), createReview);

module.exports = router;
