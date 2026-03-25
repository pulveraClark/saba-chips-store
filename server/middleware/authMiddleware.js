const isAuthenticated = (req, res, next) => {

  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized. Please login." });
  }

};

module.exports = { isAuthenticated };