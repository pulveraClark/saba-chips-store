const { ADMIN_EMAIL } = require("../utils/realtimeData");

const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized. Please login." });
  }
};

const userIsAdmin = (user) => user?.role === "admin" || user?.email === ADMIN_EMAIL;

const isAdmin = (req, res, next) => {
  if (userIsAdmin(req.session.user)) {
    next();
  } else {
    res.status(403).json({ message: "Admin access required." });
  }
};

module.exports = { isAuthenticated, isAdmin, userIsAdmin };
