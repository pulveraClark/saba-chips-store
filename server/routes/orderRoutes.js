const express = require("express");
const router = express.Router();
const { isAuthenticated, isAdmin } = require("../middleware/authMiddleware");
const {
  checkout,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/orderController");

router.post("/checkout", isAuthenticated, checkout);
router.get("/", isAuthenticated, getUserOrders);

// ADMIN ROUTES
router.get("/admin/all", isAuthenticated, isAdmin, getAllOrders);
router.put("/admin/:id/status", isAuthenticated, isAdmin, updateOrderStatus);

module.exports = router;