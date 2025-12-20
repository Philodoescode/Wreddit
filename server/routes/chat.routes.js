/**
 * Chat Routes Module
 * Routes for conversation inbox and message history
 */

const express = require("express");
const router = express.Router();

const { getConversations, getMessages } = require("../controller/chat.controller");
const { protect } = require("../middleware/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Chat and Messaging API
 */

/**
 * @swagger
 * /api/chat/conversations:
 *   get:
 *     summary: Get user conversations
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 */
router.get("/conversations", protect, getConversations);

/**
 * @swagger
 * /api/chat/messages/{conversationId}:
 *   get:
 *     summary: Get messages for a conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         schema:
 *           type: string
 *         required: true
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: List of messages
 */
router.get("/messages/:conversationId", protect, getMessages);

const { getNotifications, markAsRead } = require("../controller/chat.controller");
router.get("/notifications", protect, getNotifications);
router.post("/read", protect, markAsRead);

module.exports = router;
