/**
 * WebSocket Server Module
 * Handles WebSocket server initialization and connection management
 * Uses message-based authentication for security (token not exposed in URL)
 */

const { WebSocketServer } = require("ws");
const { verifyToken } = require("./wsAuth");
const { addClient, removeClient } = require("./connectedClients");
const { handleMessage } = require("./messageHandler");
const { initSubscriber, publishPresence, sendInitialPresence } = require("../redis/messageDispatcher");

// Authentication timeout in milliseconds (10 seconds)
const AUTH_TIMEOUT_MS = 10000;

/**
 * Initialize WebSocket server and attach to HTTP server
 * @param {http.Server} httpServer - HTTP server instance
 * @returns {WebSocketServer} - WebSocket server instance
 */
const initWebSocket = (httpServer) => {
  const wss = new WebSocketServer({ noServer: true });

  // Initialize Redis subscriber for message dispatch
  initSubscriber();

  // Handle HTTP upgrade requests - accept all connections initially
  httpServer.on("upgrade", (request, socket, head) => {
    // Complete the WebSocket handshake without token validation
    // Authentication will happen via the first message
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  // Handle new connections
  wss.on("connection", (ws) => {
    // Mark connection as unauthenticated initially
    ws.isAuthenticated = false;
    ws.userId = null;

    // Set authentication timeout - close if not authenticated in time
    const authTimeout = setTimeout(() => {
      if (!ws.isAuthenticated) {
        console.log("Authentication timeout - closing connection");
        ws.close(4001, "Authentication timeout");
      }
    }, AUTH_TIMEOUT_MS);

    // Handle incoming messages
    ws.on("message", async (data) => {
      // If not authenticated, only accept AUTHENTICATE messages
      if (!ws.isAuthenticated) {
        try {
          const message = JSON.parse(data.toString());

          if (message.type === "AUTHENTICATE") {
            const token = message.payload?.token;

            if (!token) {
              ws.send(JSON.stringify({
                type: "AUTH_ERROR",
                payload: { code: "NO_TOKEN", message: "No token provided" }
              }));
              ws.close(4002, "No token provided");
              clearTimeout(authTimeout);
              return;
            }

            try {
              const { userId } = verifyToken(token);
              
              // Authentication successful
              ws.isAuthenticated = true;
              ws.userId = userId;
              clearTimeout(authTimeout);

              // Register client in the connected clients map
              addClient(userId, ws);
              console.log(`User ${userId} connected and authenticated.`);

              // Send initial presence info to the newly connected user
              sendInitialPresence(userId);

              // Publish online presence to chat partners
              publishPresence(userId, "online");

              // Send auth success acknowledgment
              ws.send(JSON.stringify({
                type: "AUTH_SUCCESS",
                payload: { userId }
              }));

            } catch (error) {
              console.log(`Authentication failed: ${error.message}`);
              ws.send(JSON.stringify({
                type: "AUTH_ERROR",
                payload: { code: "INVALID_TOKEN", message: "Invalid or expired token" }
              }));
              ws.close(4003, "Invalid token");
              clearTimeout(authTimeout);
            }
          } else {
            // Non-AUTHENTICATE message before authentication
            ws.send(JSON.stringify({
              type: "ERROR",
              payload: { code: "NOT_AUTHENTICATED", message: "Must authenticate first" }
            }));
          }
        } catch (error) {
          ws.send(JSON.stringify({
            type: "ERROR",
            payload: { code: "INVALID_JSON", message: "Failed to parse message as JSON" }
          }));
        }
        return;
      }

      // Authenticated - handle message normally
      handleMessage(ws, data);
    });

    // Handle client disconnection
    ws.on("close", () => {
      clearTimeout(authTimeout);
      
      if (ws.isAuthenticated && ws.userId) {
        removeClient(ws.userId);
        console.log(`User ${ws.userId} disconnected.`);

        // Publish offline presence to chat partners
        publishPresence(ws.userId, "offline");
      }
    });

    // Handle errors
    ws.on("error", (error) => {
      clearTimeout(authTimeout);
      console.error(`WebSocket error:`, error.message);
    });
  });

  console.log("WebSocket server initialized (message-based auth)");
  return wss;
};

module.exports = { initWebSocket };
