const queryAsync = require("./queryAsync");

const ADMIN_EMAIL = "admin@sabachips.com";

const getAdminUser = async () => {
  const rows = await queryAsync("SELECT id, name, email FROM users WHERE email = ? LIMIT 1", [
    ADMIN_EMAIL,
  ]);
  return rows[0] || null;
};

const createNotification = async ({ userId, type = "info", title, message, link = null }) => {
  if (!userId || !title || !message) {
    return null;
  }

  const result = await queryAsync(
    `INSERT INTO notifications (user_id, type, title, message, link)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, type, title, message, link]
  );

  return result.insertId;
};

const notifyAdmin = async ({ type = "info", title, message, link = null }) => {
  const admin = await getAdminUser();
  if (!admin) {
    return null;
  }

  return createNotification({
    userId: admin.id,
    type,
    title,
    message,
    link,
  });
};

module.exports = {
  ADMIN_EMAIL,
  getAdminUser,
  createNotification,
  notifyAdmin,
};
