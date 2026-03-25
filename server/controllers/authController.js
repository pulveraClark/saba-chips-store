const db = require("../config/db");
const bcrypt = require("bcryptjs");

exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  // Check if user exists
  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
    if (result.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword],
      (err, result) => {
        if (err) {
          console.error("Register error:", err);
          return res.status(500).json({ message: "Server error" });
        }
        res.status(201).json({ message: "User registered successfully" });
      }
    );
  });
};

exports.loginUser = (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Server error" });
    }

    if (result.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = result[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Set session
    req.session.userId = user.id;
    req.session.user = { id: user.id, name: user.name, email: user.email };

    res.json({ 
      message: "Login successful",
      user: { id: user.id, name: user.name, email: user.email }
    });
  });
};

exports.logoutUser = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.json({ message: "Logout successful" });
  });
};

exports.getMe = (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
};