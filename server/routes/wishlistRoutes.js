const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/authMiddleware");
const {
  addWishlistItem,
  getWishlist,
  removeWishlistItem,
} = require("../controllers/wishlistController");

router.get("/", isAuthenticated, getWishlist);
router.post("/:productId", isAuthenticated, addWishlistItem);
router.delete("/:productId", isAuthenticated, removeWishlistItem);

module.exports = router;
