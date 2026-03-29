const express = require("express");
const cors = require("cors");
const session = require("express-session");
const db = require("./config/db"); 

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const app = express();

// Test DB connection on startup
db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  } else {
    console.log("✅ MySQL Connected");
  }
});

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.json());
app.use(session({
  secret: "sabachips_secret",
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // true in production
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

app.use("/api/auth", authRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

app.use("/api/admin", adminRoutes);

app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});