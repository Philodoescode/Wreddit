/**
 * Message Dispatcher Module
 * Handles Redis Pub/Sub for message delivery across server instances
 */

const { publisher, subscriber } = require("./redisClient");
const { getClient } = require("../websocket/connectedClients");

const CHANNEL = "global_dispatch";

/**
 * Publish a message event to Redis for delivery
 * @param {string} targetId - Recipient user ID
 * @param {string} senderId - Sender user ID
 * @param {string} text - Message text
 * @param {string} messageId - MongoDB message ID
 * @param {string} timestamp - Message creation timestamp (ISO string)
 */
const publishMessage = async (targetId, senderId, text, messageId, timestamp) => {
  const event = JSON.stringify({
    target_id: targetId,
    sender_id: senderId,
    text,
    message_id: messageId,
    timestamp,
  });

  await publisher.publish(CHANNEL, event);
  console.log("Event published to Redis");
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

    console.log("Event received from Redis");

    try {
      const { target_id, sender_id, text, message_id, timestamp } =
        JSON.parse(message);

      // Check if recipient is connected to this server instance
      const recipientSocket = getClient(target_id);

      if (recipientSocket && recipientSocket.readyState === 1) {
        // WebSocket.OPEN = 1
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
        // User is offline or connected to a different server instance
        // Message is already safely stored in MongoDB
        console.log(`User ${target_id} not connected to this instance`);
      }
    } catch (error) {
      console.error("Failed to process Redis message:", error.message);
    }
  });
};

module.exports = { publishMessage, initSubscriber };
