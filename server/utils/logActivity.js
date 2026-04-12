const db = require("../config/db");

const logActivity = ({ userId = null, userName = null, userEmail = null, action, details = null }) => {
  db.query(
    `INSERT INTO activity_logs (user_id, user_name, user_email, action, details)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, userName, userEmail, action, details],
    (err) => {
      if (err) {
        console.error("Activity log failed:", err);
      }
    }
  );
};

module.exports = logActivity;