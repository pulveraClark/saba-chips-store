const queryAsync = require("../utils/queryAsync");

const ensureUserColumn = async (definition) => {
  try {
    await queryAsync(`ALTER TABLE users ADD COLUMN ${definition}`);
  } catch (err) {
    if (err.code !== "ER_DUP_FIELDNAME") {
      throw err;
    }
  }
};

exports.id = "001_realtime_and_profile_tables";

exports.up = async () => {
  await ensureUserColumn("phone VARCHAR(30) NULL");
  await ensureUserColumn("address TEXT NULL");

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
