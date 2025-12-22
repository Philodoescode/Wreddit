/**
 * Message Dispatcher Module
 * Handles Redis Pub/Sub for message delivery across server instances
 */

const { publisher, subscriber } = require("./redisClient");
const { getClient } = require("../websocket/connectedClients");
const Conversation = require("../model/conversation.model");

const CHANNEL = "global_dispatch";

// Typing state management: Map<`${conversationId}:${userId}`, { timeoutId, userName }>
const typingStates = new Map();
const TYPING_TIMEOUT = 6000; // 6 seconds auto-clear

/**
 * Publish a message event to Redis for delivery
 * @param {string} targetId - Recipient user ID
 * @param {string} senderId - Sender user ID
 * @param {string} text - Message text
 * @param {string} messageId - MongoDB message ID
 * @param {string} timestamp - Message creation timestamp (ISO string)
 */
const publishMessage = async (targetId, senderId, text, messageId, timestamp) => {
  // Publish to recipient
  const recipientEvent = JSON.stringify({
    type: "MESSAGE",
    target_id: targetId,
    sender_id: senderId,
    text,
    message_id: messageId,
    timestamp,
  });
  await publisher.publish(CHANNEL, recipientEvent);

  // Also publish to sender (so they see their own message in real-time)
  const senderEvent = JSON.stringify({
    type: "MESSAGE",
    target_id: senderId,
    sender_id: senderId,
    text,
    message_id: messageId,
    timestamp,
  });
  await publisher.publish(CHANNEL, senderEvent);

  console.log("Message event published to Redis for both sender and recipient");
};

/**
 * Publish typing event to Redis for delivery to recipient
 * @param {string} senderId - User who is typing
 * @param {string} recipientId - User to notify
 * @param {string} conversationId - Conversation ID (optional for new chats)
 * @param {boolean} isTyping - true for typing start, false for stop
 */
const publishTypingEvent = async (senderId, recipientId, conversationId, isTyping) => {
  const stateKey = `${conversationId || recipientId}:${senderId}`;
  
  // Clear existing timeout for this user/conversation
  const existingState = typingStates.get(stateKey);
  if (existingState && existingState.timeoutId) {
    clearTimeout(existingState.timeoutId);
  }

  if (isTyping) {
    // Set up auto-clear timeout
    const timeoutId = setTimeout(() => {
      typingStates.delete(stateKey);
      // Publish stop event when timeout expires
      const stopEvent = JSON.stringify({
        type: "TYPING_STOP",
        target_id: recipientId,
        sender_id: senderId,
        conversation_id: conversationId,
        timestamp: new Date().toISOString(),
      });
      publisher.publish(CHANNEL, stopEvent);
      console.log(`Typing timeout expired for user ${senderId}`);
    }, TYPING_TIMEOUT);

    typingStates.set(stateKey, { timeoutId });

    // Publish typing start event
    const event = JSON.stringify({
      type: "TYPING_START",
      target_id: recipientId,
      sender_id: senderId,
      conversation_id: conversationId,
      timestamp: new Date().toISOString(),
    });
    await publisher.publish(CHANNEL, event);
  } else {
    // Stop typing - clear state and publish stop event
    typingStates.delete(stateKey);
    
    const event = JSON.stringify({
      type: "TYPING_STOP",
      target_id: recipientId,
      sender_id: senderId,
      conversation_id: conversationId,
      timestamp: new Date().toISOString(),
    });
    await publisher.publish(CHANNEL, event);
  }
};

/**
 * Clear typing state for a user (called on disconnect)
 * @param {string} userId - User who disconnected
 */
const clearTypingStateForUser = (userId) => {
  for (const [key] of typingStates) {
    if (key.endsWith(`:${userId}`)) {
      const state = typingStates.get(key);
      if (state && state.timeoutId) {
        clearTimeout(state.timeoutId);
      }
      typingStates.delete(key);
    }
  }
};

/**
 * Send initial presence info to a newly connected user
 * Notifies them which of their chat partners are currently online
 * @param {string} userId - Newly connected user ID
 */
const sendInitialPresence = async (userId) => {
  try {
    // Get all chat partners for this user
    const conversations = await Conversation.find(
      { participants: userId },
      { participants: 1 }
    ).lean();

    // Extract unique partner IDs (exclude self)
    const partners = [
      ...new Set(
        conversations.flatMap((c) =>
          c.participants
            .map((p) => p.toString())
            .filter((p) => p !== userId)
        )
      ),
    ];

    if (partners.length === 0) {
      console.log(`No chat partners for user ${userId}, skipping initial presence`);
      return;
    }

    // Check which partners are currently connected
    const userSocket = getClient(userId);
    if (!userSocket || userSocket.readyState !== 1) {
      return;
    }

    // Send USER_STATUS for each online partner to the newly connected user
    for (const partnerId of partners) {
      const partnerSocket = getClient(partnerId);
      const isOnline = partnerSocket && partnerSocket.readyState === 1;
      
      userSocket.send(
        JSON.stringify({
          type: "USER_STATUS",
          payload: { userId: partnerId, status: isOnline ? "online" : "offline" },
        })
      );
    }

    console.log(`Initial presence sent to user ${userId} for ${partners.length} partners`);
  } catch (error) {
    console.error("Failed to send initial presence:", error.message);
  }
};

/**
 * Publish presence (online/offline) event to Redis for targeted delivery
 * @param {string} userId - User whose status changed
 * @param {string} status - "online" or "offline"
 */
const publishPresence = async (userId, status) => {
  try {
    // If going offline, clear any typing states for this user
    if (status === "offline") {
      clearTypingStateForUser(userId);
    }

    // Query MongoDB for user's chat partners
    const conversations = await Conversation.find(
      { participants: userId },
      { participants: 1 }
    ).lean();

    // Extract unique contact IDs (exclude self)
    const targets = [
      ...new Set(
        conversations.flatMap((c) =>
          c.participants
            .map((p) => p.toString())
            .filter((p) => p !== userId)
        )
      ),
    ];

    if (targets.length === 0) {
      console.log(`No chat partners for user ${userId}, skipping presence broadcast`);
      return;
    }

    // Publish targeted presence event
    const event = JSON.stringify({
      type: "PRESENCE_CHANGE",
      senderId: userId,
      status,
      targets,
    });

    await publisher.publish(CHANNEL, event);
    console.log(`Presence ${status} published for user ${userId} to ${targets.length} targets`);
  } catch (error) {
    // Non-blocking: log error but don't disrupt connection flow
    console.error("Failed to publish presence:", error.message);
  }
};

/**
 * Initialize the Redis subscriber for message dispatch
 * Should be called once at server startup
 */
const initSubscriber = () => {
  subscriber.subscribe(CHANNEL, (err, count) => {
    if (err) {
      console.error("Failed to subscribe to Redis channel:", err.message);
      return;
    }
    console.log(`Subscribed to ${count} Redis channel(s)`);
  });

  subscriber.on("message", (channel, message) => {
    if (channel !== CHANNEL) return;

    try {
      const data = JSON.parse(message);

      if (data.type === "PRESENCE_CHANGE") {
        // Handle presence updates - deliver to locally connected targets
        handlePresenceChange(data);
      } else if (data.type === "MESSAGE") {
        // Handle chat messages
        handleMessageDelivery(data);
      } else if (data.type === "TYPING_START" || data.type === "TYPING_STOP") {
        // Handle typing events
        handleTypingEventDelivery(data);
      } else {
        console.log(`Unknown event type: ${data.type}`);
      }
    } catch (error) {
      console.error("Failed to process Redis message:", error.message);
    }
  });
};

/**
 * Handle presence change events from Redis
 * @param {Object} data - { senderId, status, targets }
 */
const handlePresenceChange = (data) => {
  const { senderId, status, targets } = data;

  for (const targetId of targets) {
    const ws = getClient(targetId);
    if (ws && ws.readyState === 1) {
      ws.send(
        JSON.stringify({
          type: "USER_STATUS",
          payload: { userId: senderId, status },
        })
      );
      console.log(`Presence ${status} delivered to user ${targetId}`);
    }
  }
};

/**
 * Handle message delivery events from Redis
 * @param {Object} data - { target_id, sender_id, text, message_id, timestamp }
 */
const handleMessageDelivery = (data) => {
  const { target_id, sender_id, text, message_id, timestamp } = data;

  const recipientSocket = getClient(target_id);

  if (recipientSocket && recipientSocket.readyState === 1) {
    recipientSocket.send(
      JSON.stringify({
        type: "NEW_MESSAGE",
        payload: {
          sender_id,
          text,
          message_id,
          timestamp,
        },
      })
    );
    console.log(`Message delivered to user ${target_id}`);
  } else {
    console.log(`User ${target_id} not connected to this instance`);
  }
};

/**
 * Handle typing event delivery from Redis
 * @param {Object} data - { type, target_id, sender_id, conversation_id, timestamp }
 */
const handleTypingEventDelivery = (data) => {
  const { type, target_id, sender_id, conversation_id, timestamp } = data;

  const recipientSocket = getClient(target_id);

  if (recipientSocket && recipientSocket.readyState === 1) {
    const eventType = type === "TYPING_START" ? "USER_TYPING" : "USER_STOPPED_TYPING";
    recipientSocket.send(
      JSON.stringify({
        type: eventType,
        payload: {
          userId: sender_id,
          conversationId: conversation_id,
          timestamp,
        },
      })
    );
  }
};

module.exports = { publishMessage, publishTypingEvent, publishPresence, initSubscriber, sendInitialPresence };


