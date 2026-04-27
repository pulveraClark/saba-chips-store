const queryAsync = require("./queryAsync");

const ADMIN_EMAIL = "admin@sabachips.com";

const initRealtimeTables = async () => {
  await queryAsync(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'info',
      title VARCHAR(150) NOT NULL,
      message TEXT NOT NULL,
      link VARCHAR(255) NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_notifications_user_created (user_id, created_at),
      INDEX idx_notifications_user_read (user_id, is_read)
    )
  `);

  await queryAsync(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sender_id INT NOT NULL,
      receiver_id INT NOT NULL,
      message TEXT NOT NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_chat_pair_created (sender_id, receiver_id, created_at),
      INDEX idx_chat_receiver_read (receiver_id, is_read)
    )
  `);

  await queryAsync(`
    CREATE TABLE IF NOT EXISTS order_cancellation_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      user_id INT NOT NULL,
      reason TEXT NOT NULL,
      status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
      admin_note TEXT NULL,
      reviewed_by INT NULL,
      reviewed_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_cancel_order (order_id),
      INDEX idx_cancel_status_created (status, created_at)
    )
  `);
};

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
  initRealtimeTables,
  getAdminUser,
  createNotification,
  notifyAdmin,
};
