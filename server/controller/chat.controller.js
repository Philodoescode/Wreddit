/**
 * Chat Controller Module
 * Handles inbox (conversations list) and message history retrieval
 */

const Conversation = require("../model/conversation.model");
const Message = require("../model/message.model");
const mongoose = require("mongoose");

/**
 * Get user's conversation inbox
 * GET /api/chat/conversations
 */
const getConversations = async (req, res) => {
  try {
    const userId = req.userId;

    // Query conversations where user is a participant, sorted by most recent
    const conversations = await Conversation.find({
      participants: userId,
    })
      .sort({ updated_at: -1 })
      .populate("participants", "username userPhotoUrl")
      .populate("last_message_sender", "username")
      .lean();

    return res.status(200).json({
      status: "success",
      data: { conversations },
    });
  } catch (error) {
    console.error("Error fetching conversations:", error.message);
    return res.status(500).json({
      status: "fail",
      message: `Error fetching conversations: ${error.message}`,
    });
  }
};

/**
 * Get message history for a conversation
 * GET /api/chat/messages/:conversationId
 * Query params: order (default: desc), limit (default: 50), before (ISO timestamp)
 */
const getMessages = async (req, res) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;

    // Validate conversationId format
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid conversation ID format",
      });
    }

    // Security: Verify user is a participant in this conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(403).json({
        status: "fail",
        message: "Access denied: You are not a participant in this conversation",
      });
    }

    // Parse query parameters with sensible defaults
    const order = req.query.order === "asc" ? 1 : -1; // Default: desc (-1)
    const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Default: 50, Max: 100
    const before = req.query.before ? new Date(req.query.before) : null;

    // Build query
    const query = { conversation_id: conversationId };

    // Add cursor condition if 'before' is provided
    if (before && !isNaN(before.getTime())) {
      query.created_at = { $lt: before };
    }

    // Query messages using the compound index (conversation_id + created_at)
    const messages = await Message.find(query)
      .sort({ created_at: order })
      .limit(limit + 1) // Fetch one extra to determine if there are more
      .populate("sender_id", "username userPhotoUrl")
      .lean();

    // Determine if there are more messages
    const hasMore = messages.length > limit;
    if (hasMore) {
      messages.pop(); // Remove the extra message
    }

    // Calculate next cursor (timestamp of the oldest message in this batch)
    let nextCursor = null;
    if (hasMore && messages.length > 0) {
      // For desc order, last message is oldest; for asc order, first message is oldest
      const oldestMessage = order === -1 ? messages[messages.length - 1] : messages[0];
      nextCursor = oldestMessage.created_at.toISOString();
    }

    return res.status(200).json({
      status: "success",
      data: {
        messages,
        hasMore,
        nextCursor,
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error.message);
    return res.status(500).json({
      status: "fail",
      message: `Error fetching messages: ${error.message}`,
    });
  }
};

const getNotifications = async (req, res) => {
  try {
    const userId = req.userId;

    // Find messages where user is NOT the sender AND user is NOT in read_by
    // We also need to ensure the user is part of the conversation (though usually implied)
    // Let's filter by conversations user is in.

    // 1. Find conversations user is in
    const conversations = await Conversation.find({ participants: userId }).select('_id');
    const conversationIds = conversations.map(c => c._id);

    // 2. Find unread messages in those conversations
    const unreadMessages = await Message.find({
      conversation_id: { $in: conversationIds },
      sender_id: { $ne: userId },
      read_by: { $ne: userId }
    })
      .sort({ created_at: -1 })
      .limit(20)
      .populate('sender_id', 'username userPhotoUrl')
      .populate('conversation_id', 'last_message') // Optional: to get context
      .lean();

    res.status(200).json({
      status: 'success',
      data: { notifications: unreadMessages }
    });

  } catch (error) {
    res.status(500).json({ status: 'fail', message: error.message });
  }
}

const markAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.body;

    if (!conversationId) {
      // Mark specific notification/message as read? Or all in a conversation?
      // Simple: Mark all in conversation as read.
      return res.status(400).json({ status: 'fail', message: 'Conversation ID required' });
    }

    await Message.updateMany(
      { conversation_id: conversationId, read_by: { $ne: userId } },
      { $addToSet: { read_by: userId } }
    );

    res.status(200).json({ status: 'success' });

  } catch (error) {
    res.status(500).json({ status: 'fail', message: error.message });
  }
}

module.exports = { getConversations, getMessages, getNotifications, markAsRead };
