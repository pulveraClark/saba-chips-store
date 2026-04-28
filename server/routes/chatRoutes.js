const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/authMiddleware");
const rateLimit = require("../middleware/rateLimitMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  getConversations,
  getMessages,
  sendMessage,
  streamChatEvents,
} = require("../controllers/chatController");
const chatSendLimiter = rateLimit({ name: "chat-send", windowMs: 60 * 1000, max: 30 });

router.get("/conversations", isAuthenticated, getConversations);
router.get("/events", isAuthenticated, streamChatEvents);
router.get("/messages", isAuthenticated, getMessages);
router.get("/messages/:userId", isAuthenticated, getMessages);
router.post("/messages", isAuthenticated, chatSendLimiter, upload.single("image"), sendMessage);

module.exports = router;
