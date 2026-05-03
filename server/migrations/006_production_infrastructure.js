const queryAsync = require("../utils/queryAsync");

exports.id = "006_production_infrastructure";

exports.up = async () => {
  await queryAsync(`
    CREATE TABLE IF NOT EXISTS sessions (
      sid VARCHAR(128) PRIMARY KEY,
      data MEDIUMTEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_sessions_expires_at (expires_at)
    )
  `);

  await queryAsync(`
    CREATE TABLE IF NOT EXISTS rate_limit_buckets (
      bucket_key VARCHAR(255) PRIMARY KEY,
      count INT NOT NULL DEFAULT 0,
      reset_at DATETIME NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_rate_limit_reset_at (reset_at)
    )
  `);
};
