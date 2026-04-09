const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/authMiddleware");
const { 
  addToCart, 
  getCart, 
  updateCartItem, 
  removeCartItem, 
  clearCart 
} = require("../controllers/cartController");

// All routes protected
router.post("/add", isAuthenticated, addToCart);
router.get("/", isAuthenticated, getCart);
router.put("/item/:id", isAuthenticated, updateCartItem);
router.delete("/item/:id", isAuthenticated, removeCartItem);
router.delete("/", isAuthenticated, clearCart);

module.exports = router;