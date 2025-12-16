/**
 * WebSocket Authentication Module
 * Handles JWT extraction and validation from query parameters
 */

const jwt = require("jsonwebtoken");
const url = require("url");

/**
 * Extract token from WebSocket request URL
 * @param {string} reqUrl - Request URL (e.g., "/?token=xxx")
 * @returns {string|null} - Token string or null if not found
 */
const extractToken = (reqUrl) => {
  try {
    const parsedUrl = url.parse(reqUrl, true);
    return parsedUrl.query.token || null;
  } catch (error) {
    return null;
  }
};

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
  extractToken,
  verifyToken,
};
