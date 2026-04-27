const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/authMiddleware");
const {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} = require("../controllers/notificationController");

router.get("/", isAuthenticated, getNotifications);
router.patch("/read-all", isAuthenticated, markAllNotificationsRead);
router.patch("/:id/read", isAuthenticated, markNotificationRead);

module.exports = router;
