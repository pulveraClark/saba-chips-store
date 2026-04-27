const queryAsync = require("../utils/queryAsync");

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.session.userId;
    const notifications = await queryAsync(
      `SELECT id, type, title, message, link, is_read, created_at
       FROM notifications
       WHERE user_id = ? AND (link IS NULL OR link <> '/messages')
       ORDER BY created_at DESC, id DESC
       LIMIT 30`,
      [userId]
    );

    const unreadResult = await queryAsync(
      "SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND is_read = 0 AND (link IS NULL OR link <> '/messages')",
      [userId]
    );

    res.json({
      notifications,
      unread: Number(unreadResult[0]?.unread || 0),
    });
  } catch (err) {
    console.error("Failed to fetch notifications:", err);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    await queryAsync("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?", [
      req.params.id,
      req.session.userId,
    ]);
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    console.error("Failed to mark notification read:", err);
    res.status(500).json({ message: "Failed to update notification" });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    await queryAsync("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [
      req.session.userId,
    ]);
    res.json({ message: "Notifications marked as read" });
  } catch (err) {
    console.error("Failed to mark notifications read:", err);
    res.status(500).json({ message: "Failed to update notifications" });
  }
};
