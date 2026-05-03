const session = require("express-session");

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

class MySQLSessionStore extends session.Store {
  constructor(db, options = {}) {
    super();
    this.db = db;
    this.ttlMs = options.ttlMs || ONE_DAY_MS;
    this.cleanupIntervalMs = options.cleanupIntervalMs || 1000 * 60 * 15;
    this.ready = this.initialize();
    this.ready.catch(() => {});

    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredSessions();
    }, this.cleanupIntervalMs);
    this.cleanupTimer.unref?.();
  }

  initialize() {
    return this.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR(128) PRIMARY KEY,
        data MEDIUMTEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_sessions_expires_at (expires_at)
      )
    `);
  }

  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.query(sql, params, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  getExpiresAt(sessionData) {
    const cookieExpires = sessionData?.cookie?.expires
      ? new Date(sessionData.cookie.expires).getTime()
      : null;
    const expiresAt = Number.isFinite(cookieExpires)
      ? cookieExpires
      : Date.now() + this.ttlMs;

    return new Date(expiresAt);
  }

  async get(sid, callback) {
    try {
      await this.ready;
      const rows = await this.query(
        "SELECT data FROM sessions WHERE sid = ? AND expires_at > NOW() LIMIT 1",
        [sid]
      );

      if (!rows.length) {
        callback(null, null);
        return;
      }

      callback(null, JSON.parse(rows[0].data));
    } catch (err) {
      callback(err);
    }
  }

  async set(sid, sessionData, callback = () => {}) {
    try {
      await this.ready;
      await this.query(
        `INSERT INTO sessions (sid, data, expires_at)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE data = VALUES(data), expires_at = VALUES(expires_at)`,
        [sid, JSON.stringify(sessionData), this.getExpiresAt(sessionData)]
      );
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  async touch(sid, sessionData, callback = () => {}) {
    try {
      await this.ready;
      await this.query("UPDATE sessions SET expires_at = ? WHERE sid = ?", [
        this.getExpiresAt(sessionData),
        sid,
      ]);
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  async destroy(sid, callback = () => {}) {
    try {
      await this.ready;
      await this.query("DELETE FROM sessions WHERE sid = ?", [sid]);
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  async cleanupExpiredSessions() {
    try {
      await this.ready;
      await this.query("DELETE FROM sessions WHERE expires_at <= NOW()");
    } catch (err) {
      console.error("Session cleanup failed:", err);
    }
  }
}

module.exports = MySQLSessionStore;
