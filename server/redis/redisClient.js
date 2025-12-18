/**
 * Redis Client Module
 * Creates separate Publisher and Subscriber connections for Pub/Sub pattern
 */

const Redis = require("ioredis");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Publisher client - for publishing messages
const publisher = new Redis(REDIS_URL);

// Subscriber client - for receiving messages (cannot publish)
const subscriber = new Redis(REDIS_URL);

// Connection event handlers
publisher.on("connect", () => {
  console.log("Redis Publisher connected");
});

publisher.on("error", (err) => {
  console.error("Redis Publisher error:", err.message);
});

subscriber.on("connect", () => {
  console.log("Redis Subscriber connected");
});

subscriber.on("error", (err) => {
  console.error("Redis Subscriber error:", err.message);
});

module.exports = { publisher, subscriber };
