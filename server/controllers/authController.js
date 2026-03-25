const db = require("../config/db");
const bcrypt = require("bcryptjs");

exports.registerUser = async (req, res) => {

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users (name,email,password) VALUES (?,?,?)",
    [name, email, hashedPassword],
    (err, result) => {

      if (err) {
        return res.status(500).json(err);
      }

      res.json({ message: "User registered successfully" });
    }
  );
};

exports.loginUser = (req, res) => {

  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email=?",
    [email],
    async (err, result) => {

      if (result.length === 0) {
        return res.status(400).json({ message: "User not found" });
      }

      const user = result[0];

      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res.status(401).json({ message: "Invalid password" });
      }

      req.session.userId = user.id;

      res.json({ message: "Login successful" });
    }
  );
};

exports.logoutUser = (req, res) => {

  req.session.destroy(() => {
    res.json({ message: "Logout successful" });
  });

};