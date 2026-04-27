const express = require("express");
const router = express.Router();
const { askTasteAssistant } = require("../controllers/aiController");
const rateLimit = require("../middleware/rateLimitMiddleware");

router.post(
  "/taste-assistant",
  rateLimit({ name: "ai", windowMs: 60 * 1000, max: 20 }),
  askTasteAssistant
);

module.exports = router;
