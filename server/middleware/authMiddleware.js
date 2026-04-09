const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized. Please login." });
  }
};

// NEW: Admin only (email = admin@sabachips.com)
const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.email === 'admin@sabachips.com') {
    next();
  } else {
    res.status(403).json({ message: "Admin access required." });
  }
};

module.exports = { isAuthenticated, isAdmin };