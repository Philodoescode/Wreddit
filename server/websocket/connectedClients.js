/**
 * In-Memory Connected Clients Registry
 * Maps userId (string) to WebSocket instance
 */

// Map<string, WebSocket>
const connectedClients = new Map();

/**
 * Add a client to the registry
 * @param {string} userId - User ID from JWT
 * @param {WebSocket} ws - WebSocket instance
 */
const addClient = (userId, ws) => {
  // If user already has a connection, close the old one
  if (connectedClients.has(userId)) {
    const existingWs = connectedClients.get(userId);
    existingWs.close(4000, "New connection established");
  }
  connectedClients.set(userId, ws);
};

/**
 * Remove a client from the registry
 * @param {string} userId - User ID to remove
 */
const removeClient = (userId) => {
  connectedClients.delete(userId);
};

/**
 * Get a client's WebSocket by userId
 * @param {string} userId - User ID to find
 * @returns {WebSocket|undefined}
 */
const getClient = (userId) => {
  return connectedClients.get(userId);
};

/**
 * Get all connected client IDs
 * @returns {string[]}
 */
const getAllClientIds = () => {
  return Array.from(connectedClients.keys());
};

module.exports = {
  connectedClients,
  addClient,
  removeClient,
  getClient,
  getAllClientIds,
};
