const db = require("../config/db");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const logActivity = require("../utils/logActivity");
const queryAsync = require("../utils/queryAsync");

exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
    if (err) {
      console.error("Register check error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (result.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword],
      (err, insertResult) => {
        if (err) {
          console.error("Register error:", err);
          return res.status(500).json({ message: "Server error" });
        }

        logActivity({
          userId: insertResult.insertId,
          userName: name,
          userEmail: email,
          action: "User registered",
          details: `${name} created a new account`,
        });

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

    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
    };

    logActivity({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: "User logged in",
      details: `${user.name} logged into the system`,
    });

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
      },
    });
  });
};

exports.logoutUser = (req, res) => {
  const user = req.session.user;

  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }

    if (user) {
      logActivity({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action: "User logged out",
        details: `${user.name} logged out of the system`,
      });
    }

    res.json({ message: "Logout successful" });
  });
};

exports.getMe = (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  db.query(
    "SELECT id, name, email, phone, address FROM users WHERE id = ?",
    [req.session.userId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Failed to load profile" });
      }

      if (!results.length) {
        return res.status(404).json({ message: "User not found" });
      }

      req.session.user = results[0];
      res.json({ user: results[0] });
    }
  );
};

exports.updateMe = async (req, res) => {
  try {
    const userId = req.session.userId;
    const currentUser = req.session.user;
    const name = req.body.name?.trim();
    const email = req.body.email?.trim();
    const phone = req.body.phone?.trim() || null;
    const address = req.body.address?.trim() || null;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    if (phone && !/^(09|\+639)\d{9}$/.test(phone)) {
      return res.status(400).json({ message: "Please enter a valid Philippine mobile number" });
    }

    const duplicates = await queryAsync(
      "SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1",
      [email, userId]
    );

    if (duplicates.length) {
      return res.status(400).json({ message: "Email is already used by another account" });
    }

    await queryAsync(
      "UPDATE users SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?",
      [name, email, phone, address, userId]
    );

    const updatedUser = { id: userId, name, email, phone, address };
    req.session.user = updatedUser;

    logActivity({
      userId,
      userName: name,
      userEmail: email,
      action: "Profile updated",
      details: `${currentUser?.name || name} updated their profile details`,
    });

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

exports.forgotPassword = (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
    if (err) {
      console.error("Forgot password error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (result.length === 0) {
      return res.json({
        message: "If that email exists, a password reset link has been sent.",
      });
    }

    const user = result[0];
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 30);

    db.query(
      "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?",
      [resetToken, expires, user.id],
      async (updateErr) => {
        if (updateErr) {
          console.error("Reset token save error:", updateErr);
          return res.status(500).json({ message: "Server error" });
        }

        const resetLink = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password/${resetToken}`;

        try {
          await sendEmail({
            to: user.email,
            subject: "Reset Your Saba Chips Password",
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Reset Your Password</h2>
                <p>Hello ${user.name},</p>
                <p>You requested to reset your Saba Chips account password.</p>
                <p>
                  <a href="${resetLink}" style="display:inline-block;padding:12px 20px;background:#8b5e34;color:#fff;text-decoration:none;border-radius:8px;">
                    Reset Password
                  </a>
                </p>
                <p>This link will expire in 30 minutes.</p>
                <p>If you did not request this, you can ignore this email.</p>
              </div>
            `,
          });

          res.json({
            message: "If that email exists, a password reset link has been sent.",
          });
        } catch (mailErr) {
          console.error("Mail send error:", mailErr);
          return res.status(500).json({ message: "Failed to send reset email" });
        }
      }
    );
  });
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: "New password is required" });
  }

  db.query(
    "SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()",
    [token],
    async (err, result) => {
      if (err) {
        console.error("Reset password query error:", err);
        return res.status(500).json({ message: "Server error" });
      }

      if (result.length === 0) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      const user = result[0];
      const hashedPassword = await bcrypt.hash(password, 10);

      db.query(
        "UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?",
        [hashedPassword, user.id],
        (updateErr) => {
          if (updateErr) {
            console.error("Reset password update error:", updateErr);
            return res.status(500).json({ message: "Failed to reset password" });
          }

          logActivity({
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            action: "Password reset",
            details: `${user.name} reset their password`,
          });

          res.json({ message: "Password reset successful" });
        }
      );
    }
  );
};
