const buckets = new Map();

const getClientKey = (req, name) =>
  `${name}:${req.ip || req.socket.remoteAddress || "unknown"}:${req.session?.userId || "guest"}`;

const rateLimit = ({ name, windowMs, max }) => (req, res, next) => {
  const key = getClientKey(req, name);
  const now = Date.now();
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

rateLimit._clear = () => buckets.clear();

module.exports = rateLimit;
