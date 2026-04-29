const mysql = require("mysql2");

const connectionConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "saba_chips_db",
};

if (process.env.DB_SSL === "true") {
  connectionConfig.ssl = process.env.DB_SSL_CA
    ? { ca: process.env.DB_SSL_CA.replace(/\\n/g, "\n") }
    : { rejectUnauthorized: true };
}

const db = mysql.createConnection(connectionConfig);

module.exports = db;
