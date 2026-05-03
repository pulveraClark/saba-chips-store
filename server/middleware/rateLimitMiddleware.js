const queryAsync = require("../utils/queryAsync");

const buckets = new Map();
const usePersistentStore = process.env.NODE_ENV === "production";

const getClientKey = (req, name) =>
  `${name}:${req.ip || req.socket.remoteAddress || "unknown"}:${req.session?.userId || "guest"}`;

const applyMemoryLimit = ({ key, windowMs, max, now, res, next }) => {
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }

  if (current.count >= max) {
    const retryAfter = Math.ceil((current.resetAt - now) / 1000);
    res.setHeader("Retry-After", String(retryAfter));
    return res.status(429).json({
      message: "Too many requests. Please try again shortly.",
    });
  }

  current.count += 1;
  return next();
};

const applyPersistentLimit = async ({ key, windowMs, max, now, res, next }) => {
  const nextResetAt = new Date(now + windowMs);

  await queryAsync(
    `INSERT INTO rate_limit_buckets (bucket_key, count, reset_at)
     VALUES (?, 1, ?)
     ON DUPLICATE KEY UPDATE
       count = IF(reset_at <= NOW(), 1, count + 1),
       reset_at = IF(reset_at <= NOW(), VALUES(reset_at), reset_at)`,
    [key, nextResetAt]
  );

  const rows = await queryAsync(
    "SELECT count, reset_at FROM rate_limit_buckets WHERE bucket_key = ? LIMIT 1",
    [key]
  );
  const current = rows[0];

  if (Math.random() < 0.01) {
    queryAsync("DELETE FROM rate_limit_buckets WHERE reset_at <= NOW()").catch((err) => {
      console.error("Rate limit cleanup failed:", err);
    });
  }

  if (Number(current?.count || 0) > max) {
    const resetAt = new Date(current.reset_at).getTime();
    const retryAfter = Math.max(1, Math.ceil((resetAt - now) / 1000));
    res.setHeader("Retry-After", String(retryAfter));
    return res.status(429).json({
      message: "Too many requests. Please try again shortly.",
    });
  }

  return next();
};

const rateLimit = ({ name, windowMs, max }) => async (req, res, next) => {
  const key = getClientKey(req, name);
  const now = Date.now();

  try {
    if (!usePersistentStore) {
      return applyMemoryLimit({ key, windowMs, max, now, res, next });
    }

    return await applyPersistentLimit({ key, windowMs, max, now, res, next });
  } catch (err) {
    return next(err);
  }
};

rateLimit._clear = () => buckets.clear();

module.exports = rateLimit;
