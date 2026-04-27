const express = require("express");
const router = express.Router();
const { isAuthenticated, isAdmin } = require("../middleware/authMiddleware");
const {
  checkout,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  requestCancellation,
  reviewCancellationRequest,
} = require("../controllers/orderController");

router.post("/checkout", isAuthenticated, checkout);
router.get("/", isAuthenticated, getUserOrders);
router.post("/:id/cancellation-requests", isAuthenticated, requestCancellation);

// ADMIN ROUTES
router.get("/admin/all", isAuthenticated, isAdmin, getAllOrders);
router.put("/admin/:id/status", isAuthenticated, isAdmin, updateOrderStatus);
router.put(
  "/admin/cancellation-requests/:requestId",
  isAuthenticated,
  isAdmin,
  reviewCancellationRequest
);

module.exports = router;
