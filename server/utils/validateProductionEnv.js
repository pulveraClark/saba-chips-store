const getAllowedOrigins = () =>
  (process.env.CLIENT_URLS || process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const validateProductionEnv = () => {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const missing = [];
  const weak = [];
  const required = [
    "SESSION_SECRET",
    "DB_HOST",
    "DB_USER",
    "DB_PASSWORD",
    "DB_NAME",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];

  required.forEach((key) => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  const allowedOrigins = getAllowedOrigins();
  if (!allowedOrigins.length) {
    missing.push("CLIENT_URLS or CLIENT_URL");
  }

  if (
    !process.env.SESSION_SECRET ||
    process.env.SESSION_SECRET === "sabachips_secret" ||
    process.env.SESSION_SECRET === "change_this_secret" ||
    process.env.SESSION_SECRET.length < 32
  ) {
    weak.push("SESSION_SECRET must be a random value of at least 32 characters");
  }

  if (process.env.DB_SSL !== "true") {
    weak.push("DB_SSL should be true for Aiven MySQL production connections");
  }

  if (process.env.DB_SSL === "true" && !process.env.DB_SSL_CA) {
    weak.push("DB_SSL_CA should contain the Aiven CA certificate");
  }

  const localhostOrigins = allowedOrigins.filter((origin) =>
    /^http:\/\/localhost(?::\d+)?$/i.test(origin)
  );

  if (localhostOrigins.length) {
    console.warn(
      `Production CLIENT_URLS includes local development origins: ${localhostOrigins.join(", ")}`
    );
  }

  ["MAILTRAP_PASS", "GCASH_ACCOUNT_NAME", "GCASH_NUMBER"].forEach((key) => {
    if (!process.env[key]) {
      console.warn(`Production optional env var is not set: ${key}`);
    }
  });

  if (missing.length || weak.length) {
    const messages = [];
    if (missing.length) {
      messages.push(`Missing required production env vars: ${missing.join(", ")}`);
    }
    if (weak.length) {
      messages.push(weak.join("; "));
    }

    throw new Error(messages.join(". "));
  }
};

module.exports = validateProductionEnv;
