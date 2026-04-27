const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/authMiddleware");
const { getConversations, getMessages, sendMessage } = require("../controllers/chatController");

router.get("/conversations", isAuthenticated, getConversations);
router.get("/messages", isAuthenticated, getMessages);
router.get("/messages/:userId", isAuthenticated, getMessages);
router.post("/messages", isAuthenticated, sendMessage);

module.exports = router;
