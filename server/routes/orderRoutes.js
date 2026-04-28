const express = require("express");
const router = express.Router();
const { isAuthenticated, isAdmin } = require("../middleware/authMiddleware");
const rateLimit = require("../middleware/rateLimitMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  checkout,
  getPaymentSettings,
  getUserOrders,
  getAllOrders,
  reviewPayment,
  markRefunded,
  updateOrderStatus,
  requestCancellation,
  reviewCancellationRequest,
} = require("../controllers/orderController");
const orderWriteLimiter = rateLimit({ name: "order-write", windowMs: 60 * 1000, max: 20 });

router.get("/payment-settings", isAuthenticated, getPaymentSettings);
router.post(
  "/checkout",
  isAuthenticated,
  orderWriteLimiter,
  upload.single("paymentProof"),
  checkout
);
router.get("/", isAuthenticated, getUserOrders);
router.post("/:id/cancellation-requests", isAuthenticated, orderWriteLimiter, requestCancellation);

// ADMIN ROUTES
router.get("/admin/all", isAuthenticated, isAdmin, getAllOrders);
router.put("/admin/:id/payment", isAuthenticated, isAdmin, orderWriteLimiter, reviewPayment);
router.put("/admin/:id/refund", isAuthenticated, isAdmin, orderWriteLimiter, markRefunded);
router.put("/admin/:id/status", isAuthenticated, isAdmin, orderWriteLimiter, updateOrderStatus);
router.put(
  "/admin/cancellation-requests/:requestId",
  isAuthenticated,
  isAdmin,
  orderWriteLimiter,
  reviewCancellationRequest
);

module.exports = router;
