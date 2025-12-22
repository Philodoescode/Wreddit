/**
 * WebSocket Message Handler Module
 * Handles incoming messages with persistence to MongoDB before delivery
 */

const Message = require("../model/message.model");
const Conversation = require("../model/conversation.model");
const mongoose = require("mongoose");
const { publishMessage, publishTypingEvent } = require("../redis/messageDispatcher");

/**
 * Handle incoming WebSocket messages
 * @param {WebSocket} ws - WebSocket instance with userId attached
 * @param {Buffer|string} rawData - Raw message data from client
 */
const handleMessage = async (ws, rawData) => {
  let data;

  // Parse incoming JSON
  try {
    data = JSON.parse(rawData.toString());
  } catch (error) {
    sendError(ws, "INVALID_JSON", "Failed to parse message as JSON");
    return;
  }

  // Route by message type
  switch (data.type) {
    case "SEND_MESSAGE":
      await handleSendMessage(ws, data.payload);
      break;
    case "TYPING_START":
      await handleTypingEvent(ws, data.payload, true);
      break;
    case "TYPING_STOP":
      await handleTypingEvent(ws, data.payload, false);
      break;
    default:
      // Unknown message type - ignore or log
      console.log(`Unknown message type: ${data.type}`);
  }
};

/**
 * Handle typing start/stop events
 * @param {WebSocket} ws - WebSocket instance with userId attached
 * @param {Object} payload - { recipientId, conversationId }
 * @param {boolean} isTyping - Whether user started or stopped typing
 */
const handleTypingEvent = async (ws, payload, isTyping) => {
  const senderId = ws.userId;

  if (!senderId) {
    sendError(ws, "UNAUTHORIZED", "Socket not authenticated");
    return;
  }

  if (!payload || !payload.recipientId) {
    sendError(ws, "INVALID_PAYLOAD", "Missing recipientId in typing payload");
    return;
  }

  const { recipientId, conversationId } = payload;

  // Validate recipientId
  if (!mongoose.Types.ObjectId.isValid(recipientId)) {
    sendError(ws, "INVALID_RECIPIENT", "Invalid recipient ID format");
    return;
  }

  try {
    // Publish typing event to Redis for delivery to recipient
    await publishTypingEvent(senderId, recipientId, conversationId, isTyping);
  } catch (error) {
    console.error("Failed to publish typing event:", error.message);
  }
};

/**
 * Handle SEND_MESSAGE type messages
 * @param {WebSocket} ws - WebSocket instance with userId attached
 * @param {Object} payload - Message payload { recipientId, text }
 */
const handleSendMessage = async (ws, payload) => {
  const senderId = ws.userId;

  // Validate payload
  if (!payload || !payload.recipientId || !payload.text) {
    sendError(ws, "INVALID_PAYLOAD", "Missing recipientId or text in payload");
    return;
  }

  const { recipientId, text } = payload;

  // Security check: Verify the socket sender matches the authenticated user
  // The userId is set during handshake from the JWT, so this is implicitly verified
  // We just ensure senderId is valid
  if (!senderId) {
    sendError(ws, "UNAUTHORIZED", "Socket not authenticated");
    return;
  }

  // Validate recipientId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(recipientId)) {
    sendError(ws, "INVALID_RECIPIENT", "Invalid recipient ID format");
    return;
  }

  try {
    // Step 1: Resolve or create conversation
    const conversation = await findOrCreateConversation(senderId, recipientId);

    // Step 2: Create message document
    const message = await Message.create({
      conversation_id: conversation._id,
      sender_id: senderId,
      text: text,
    });

    // Step 3: Update conversation with last message and sender
    conversation.last_message = text;
    conversation.last_message_sender = senderId;
    await conversation.save();

    console.log("Message persisted to Mongo");

    // Step 4: Publish to Redis for delivery to recipient
    await publishMessage(
      recipientId,
      senderId,
      text,
      message._id.toString(),
      message.created_at.toISOString(),
      conversation._id.toString()
    );

    // Send success acknowledgment to sender
    ws.send(
      JSON.stringify({
        type: "MESSAGE_SENT",
        payload: {
          messageId: message._id,
          conversationId: conversation._id,
          text: text,
          recipientId: recipientId,
          created_at: message.created_at,
        },
      })
    );

    console.log(
      `Message saved: ${senderId} -> ${recipientId} in conversation ${conversation._id}`
    );
  } catch (error) {
    console.error("Failed to save message:", error.message);
    sendError(ws, "MESSAGE_SAVE_FAILED", "Failed to save message to database");
  }
};

/**
 * Find existing conversation between two users or create a new one
 * @param {string} userA - First user ID
 * @param {string} userB - Second user ID
 * @returns {Promise<Conversation>} - Conversation document
 */
const findOrCreateConversation = async (userA, userB) => {
  // Find existing conversation with exactly these two participants
  let conversation = await Conversation.findOne({
    participants: { $all: [userA, userB], $size: 2 },
  });

  // If no conversation exists, create one
  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userA, userB],
    });
    console.log(`Created new conversation between ${userA} and ${userB}`);
  }

  return conversation;
};

/**
 * Send error frame to client
 * @param {WebSocket} ws - WebSocket instance
 * @param {string} code - Error code
 * @param {string} message - Error message
 */
const sendError = (ws, code, message) => {
  ws.send(
    JSON.stringify({
      type: "ERROR",
      payload: { code, message },
    })
  );
};

module.exports = { handleMessage };
