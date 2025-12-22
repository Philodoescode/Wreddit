/**
 * WebSocket Authentication Module
 * Handles JWT validation for WebSocket connections
 */

const jwt = require("jsonwebtoken");

/**
 * Verify JWT token and return user ID
 * @param {string} token - JWT token string
 * @returns {{ userId: string }} - Object containing userId
 * @throws {Error} - If token is invalid or expired
 */
const verifyToken = (token) => {
  if (!token) {
    throw new Error("No token provided");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Extract userId from various possible JWT claim locations
  const userId = decoded.sub || decoded.id || decoded.userId;

  if (!userId) {
    throw new Error("Token does not contain user ID");
  }

  return { userId };
};

module.exports = {
  verifyToken,
};
