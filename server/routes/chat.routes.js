/**
 * Chat Routes Module
 * Routes for conversation inbox and message history
 */

const express = require("express");
const router = express.Router();

const { getConversations, getMessages } = require("../controller/chat.controller");
const { protect } = require("../middleware/auth.middleware");

// GET /api/chat/conversations - Get user's inbox (protected)
router.get("/conversations", protect, getConversations);

// GET /api/chat/messages/:conversationId - Get message history (protected)
router.get("/messages/:conversationId", protect, getMessages);

const { getNotifications, markAsRead } = require("../controller/chat.controller");
router.get("/notifications", protect, getNotifications);
router.post("/read", protect, markAsRead);

module.exports = router;
