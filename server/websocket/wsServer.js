/**
 * WebSocket Server Module
 * Handles WebSocket server initialization and connection management
 */

const { WebSocketServer } = require("ws");
const { extractToken, verifyToken } = require("./wsAuth");
const { addClient, removeClient } = require("./connectedClients");
const { handleMessage } = require("./messageHandler");

/**
 * Initialize WebSocket server and attach to HTTP server
 * @param {http.Server} httpServer - HTTP server instance
 * @returns {WebSocketServer} - WebSocket server instance
 */
const initWebSocket = (httpServer) => {
  const wss = new WebSocketServer({ noServer: true });

  // Handle HTTP upgrade requests
  httpServer.on("upgrade", (request, socket, head) => {
    // Extract and verify token before completing upgrade
    const token = extractToken(request.url);

    try {
      const { userId } = verifyToken(token);

      // Token is valid, complete the WebSocket handshake
      wss.handleUpgrade(request, socket, head, (ws) => {
        // Attach userId to the WebSocket instance
        ws.userId = userId;
        wss.emit("connection", ws, request);
      });
    } catch (error) {
      // Token is invalid or expired - reject the connection
      console.log(`WebSocket auth failed: ${error.message}`);
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
    }
  });

  // Handle new connections
  wss.on("connection", (ws) => {
    const userId = ws.userId;

    // Register client in the connected clients map
    addClient(userId, ws);
    console.log(`User ${userId} connected.`);

    // Handle incoming messages
    ws.on("message", (data) => {
      handleMessage(ws, data);
    });

    // Handle client disconnection
    ws.on("close", () => {
      removeClient(userId);
      console.log(`User ${userId} disconnected.`);
    });

    // Handle errors
    ws.on("error", (error) => {
      console.error(`WebSocket error for user ${userId}:`, error.message);
    });

    // Optional: Send a welcome message
    ws.send(JSON.stringify({ type: "connected", userId }));
  });

  console.log("WebSocket server initialized");
  return wss;
};

module.exports = { initWebSocket };
