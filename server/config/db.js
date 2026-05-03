const mysql = require("mysql2");

const connectionConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "saba_chips_db",
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: Number(process.env.DB_QUEUE_LIMIT || 0),
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

if (process.env.DB_SSL === "true") {
  connectionConfig.ssl = process.env.DB_SSL_CA
    ? { ca: process.env.DB_SSL_CA.replace(/\\n/g, "\n") }
    : { rejectUnauthorized: true };
}

const db = mysql.createPool(connectionConfig);

module.exports = db;
