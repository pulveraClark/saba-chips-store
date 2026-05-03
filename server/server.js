require("dotenv").config();

const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const db = require("./config/db");
const { csrfProtection } = require("./middleware/csrfMiddleware");
const MySQLSessionStore = require("./utils/mysqlSessionStore");
const validateProductionEnv = require("./utils/validateProductionEnv");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const productRoutes = require("./routes/productRoutes");
const aiRoutes = require("./routes/aiRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const chatRoutes = require("./routes/chatRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const runMigrations = require("./utils/runMigrations");

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const uploadsDir = path.join(__dirname, "uploads");
const allowedOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

try {
  validateProductionEnv();
} catch (err) {
  console.error("Invalid production configuration:", err.message);
  process.exit(1);
}

const sessionStore = new MySQLSessionStore(db, {
  ttlMs: 1000 * 60 * 60 * 24,
});

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const testDatabaseConnection = () =>
  new Promise((resolve, reject) => {
    db.getConnection((err, connection) => {
      if (err) {
        reject(err);
        return;
      }

      connection.release();
      resolve();
    });
  });

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "1mb" }));
app.use(express.urlencoded({ extended: true, limit: process.env.URLENCODED_BODY_LIMIT || "1mb" }));

if (isProduction) {
  app.set("trust proxy", 1);
}

app.use(
  session({
    name: "saba.sid",
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "sabachips_secret",
    resave: false,
    saveUninitialized: false,
    proxy: isProduction,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use(csrfProtection);

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/uploads", express.static(uploadsDir));

app.get("/api/health", (req, res) => {
  db.query("SELECT 1 AS ok", (err) => {
    if (err) {
      return res.status(503).json({
        status: "ERROR",
        database: "DOWN",
        timestamp: new Date(),
      });
    }

    return res.json({
      status: "OK",
      database: "OK",
      timestamp: new Date(),
    });
  });
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    err.statusCode = 413;
    err.message = "Uploaded image is too large";
  }

  const statusCode =
    err.statusCode ||
    err.status ||
    (err.message === "CORS origin not allowed" ? 403 : 500);
  const publicMessage =
    statusCode >= 500 && isProduction
      ? "Server error. Please try again later."
      : err.message || "Server error";

  console.error("Request failed:", {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message: err.message,
    stack: isProduction ? undefined : err.stack,
  });

  return res.status(statusCode).json({ message: publicMessage });
});

const PORT = process.env.PORT || 5000;
testDatabaseConnection()
  .then(() => {
    console.log("MySQL pool connected");
    return runMigrations();
  })
  .then(() => sessionStore.ready)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to run database migrations:", err);
    process.exit(1);
  });
