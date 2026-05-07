const crypto = require("crypto");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const ensureCsrfToken = (req) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }

  return req.session.csrfToken;
};

const getCsrfToken = (req, res, next) => {
  const token = ensureCsrfToken(req);

  if (typeof req.session.save === "function") {
    req.session.save((err) => {
      if (err) {
        return next(err);
      }

      return res.json({ csrfToken: token });
    });
    return;
  }

  res.json({ csrfToken: token });
};

const csrfProtection = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) {
    ensureCsrfToken(req);
    return next();
  }

  const expectedToken = req.session.csrfToken;
  const submittedToken = req.get("x-csrf-token");

  if (!expectedToken || !submittedToken || submittedToken !== expectedToken) {
    return res.status(403).json({ message: "Invalid security token. Please refresh and try again." });
  }

  return next();
};

module.exports = {
  csrfProtection,
  getCsrfToken,
};
