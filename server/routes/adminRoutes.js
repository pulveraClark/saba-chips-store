const express = require("express");
const router = express.Router();
const { isAuthenticated, isAdmin } = require("../middleware/authMiddleware");
const {
  getAllUsers,
  getActivityLogs,
  updateUser,
  deleteUser,
  getAdminSummary,
  getTransactionHistory,
  getSalesChartData,
  getOrderStatusChartData,
  getTopProductsChartData,
  getAdvancedInsights,
} = require("../controllers/adminController");

router.get("/users", isAuthenticated, isAdmin, getAllUsers);
router.get("/activity-logs", isAuthenticated, isAdmin, getActivityLogs);
router.put("/users/:id", isAuthenticated, isAdmin, updateUser);
router.delete("/users/:id", isAuthenticated, isAdmin, deleteUser);

router.get("/reports/summary", isAuthenticated, isAdmin, getAdminSummary);
router.get("/reports/transactions", isAuthenticated, isAdmin, getTransactionHistory);
router.get("/reports/charts/sales", isAuthenticated, isAdmin, getSalesChartData);
router.get("/reports/charts/status", isAuthenticated, isAdmin, getOrderStatusChartData);
router.get("/reports/charts/top-products", isAuthenticated, isAdmin, getTopProductsChartData);
router.get("/reports/advanced-insights", isAuthenticated, isAdmin, getAdvancedInsights);

module.exports = router;