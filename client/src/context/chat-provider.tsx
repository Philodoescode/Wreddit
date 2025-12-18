import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "./auth-provider";
import type {
  ChatContextState,
  NewMessagePayload,
  MessageSentPayload,
  UserStatusPayload,
  ErrorPayload,
  WebSocketMessage,
} from "../types/chat.types";

const ChatContext = createContext<ChatContextState | undefined>(undefined);

// WebSocket server configuration
const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:5000";
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const RECONNECT_DELAY = 3000; // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 5;

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { token, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // WebSocket instance ref
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatIntervalRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isIntentionalCloseRef = useRef(false);

  // Event handler refs using Set for multiple subscribers
  const newMessageHandlersRef = useRef<Set<(message: NewMessagePayload) => void>>(new Set());
  const messageSentHandlersRef = useRef<Set<(ack: MessageSentPayload) => void>>(new Set());
  const userStatusHandlersRef = useRef<Set<(status: UserStatusPayload) => void>>(new Set());
  const errorHandlersRef = useRef<Set<(error: ErrorPayload) => void>>(new Set());

  /**
   * Connect to WebSocket server with JWT token
   */
  const connect = useCallback(() => {
    // Don't connect if already connected or connecting
    if (wsRef.current?.readyState === WebSocket.OPEN || isConnecting) {
      return;
    }

    // Don't connect if not authenticated
    if (!isAuthenticated || !token) {
      console.log("Cannot connect: User not authenticated");
      return;
    }

    setIsConnecting(true);
    setError(null);
    isIntentionalCloseRef.current = false;

    try {
      // Append JWT token to WebSocket URL as query parameter
      const wsUrl = `${WS_URL}?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Start heartbeat to keep connection alive
        startHeartbeat();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleIncomingMessage(message);
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      ws.onerror = (event) => {
        console.error("WebSocket error:", event);
        setError("WebSocket connection error");
      };

      ws.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        stopHeartbeat();

        // Attempt reconnection if not intentionally closed
        if (!isIntentionalCloseRef.current && isAuthenticated) {
          attemptReconnect();
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("Failed to create WebSocket connection:", err);
      setError("Failed to initialize WebSocket connection");
      setIsConnecting(false);
    }
  }, [isAuthenticated, token, isConnecting]);

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback(() => {
    isIntentionalCloseRef.current = true;
    stopHeartbeat();
    clearReconnectTimeout();

    if (wsRef.current) {
      wsRef.current.close(1000, "User logged out");
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  /**
   * Handle incoming WebSocket messages and route to appropriate handlers
   */
  const handleIncomingMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case "NEW_MESSAGE":
        // Notify all registered new message handlers
        newMessageHandlersRef.current.forEach((handler) => handler(message.payload));
        break;

      case "MESSAGE_SENT":
        // Notify all registered message sent handlers
        messageSentHandlersRef.current.forEach((handler) => handler(message.payload));
        break;

      case "USER_STATUS":
        // Notify all registered user status handlers
        userStatusHandlersRef.current.forEach((handler) => handler(message.payload));
        break;

      case "ERROR":
        // Notify all registered error handlers
        errorHandlersRef.current.forEach((handler) => handler(message.payload));
        setError(message.payload.message);
        break;

      case "connected":
        console.log("Connection acknowledged by server for user:", message.userId);
        break;

      default:
        console.log("Unknown message type:", message);
    }
  }, []);

  /**
   * Send a chat message to a recipient
   */
  const sendMessage = useCallback(
    (recipientId: string, text: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.error("Cannot send message: WebSocket not connected");
        setError("Not connected to chat server");
        return;
      }

      const message = {
        type: "SEND_MESSAGE",
        payload: {
          recipientId,
          text,
        },
      };

      wsRef.current.send(JSON.stringify(message));
    },
    []
  );

  /**
   * Start sending periodic heartbeat/ping to keep connection alive
   */
  const startHeartbeat = useCallback(() => {
    stopHeartbeat(); // Clear any existing heartbeat

    heartbeatIntervalRef.current = window.setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        // Send a ping message (you can customize this based on your server)
        // For now, we just check the connection state
        // If your server supports ping frames, you can use ws.ping() instead
        console.log("Heartbeat: Connection alive");
      } else {
        console.log("Heartbeat: Connection lost");
        stopHeartbeat();
      }
    }, HEARTBEAT_INTERVAL);
  }, []);

  /**
   * Stop heartbeat
   */
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current !== null) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  /**
   * Attempt to reconnect with exponential backoff
   */
  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error("Max reconnection attempts reached");
      setError("Failed to reconnect to chat server");
      return;
    }

    const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current);
    console.log(
      `Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`
    );

    reconnectTimeoutRef.current = window.setTimeout(() => {
      reconnectAttemptsRef.current++;
      connect();
    }, delay);
  }, [connect]);

  /**
   * Clear reconnection timeout
   */
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current !== null) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  /**
   * Manual reconnect function exposed to consumers
   */
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    disconnect();
    setTimeout(() => connect(), 500);
  }, [connect, disconnect]);

  /**
   * Register event handlers
   */
  const onNewMessage = useCallback((handler: (message: NewMessagePayload) => void) => {
    newMessageHandlersRef.current.add(handler);
    return () => {
      newMessageHandlersRef.current.delete(handler);
    };
  }, []);

  const onMessageSent = useCallback((handler: (ack: MessageSentPayload) => void) => {
    messageSentHandlersRef.current.add(handler);
    return () => {
      messageSentHandlersRef.current.delete(handler);
    };
  }, []);

  const onUserStatus = useCallback((handler: (status: UserStatusPayload) => void) => {
    userStatusHandlersRef.current.add(handler);
    return () => {
      userStatusHandlersRef.current.delete(handler);
    };
  }, []);

  const onError = useCallback((handler: (error: ErrorPayload) => void) => {
    errorHandlersRef.current.add(handler);
    return () => {
      errorHandlersRef.current.delete(handler);
    };
  }, []);

  /**
   * Handle page visibility changes (tab switching, minimize)
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden - keep connection but stop heartbeat to save resources
        console.log("Page hidden - maintaining connection");
      } else {
        // Tab is visible again - resume heartbeat and check connection
        console.log("Page visible - checking connection");
        if (!isConnected && isAuthenticated) {
          reconnect();
        } else if (isConnected) {
          startHeartbeat();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isConnected, isAuthenticated, reconnect, startHeartbeat]);

  /**
   * Connect/disconnect based on authentication status
   */
  useEffect(() => {
    if (isAuthenticated && token) {
      connect();
    } else {
      disconnect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [isAuthenticated, token, connect, disconnect]);

  /**
   * Handle browser refresh/reload - reconnect on mount if authenticated
   */
  useEffect(() => {
    // Check if user was authenticated (token in localStorage)
    // This is already handled by AuthProvider, so we just need to connect
    if (isAuthenticated && !isConnected && !isConnecting) {
      connect();
    }
  }, [isAuthenticated, isConnected, isConnecting, connect]);

  const contextValue: ChatContextState = {
    isConnected,
    isConnecting,
    error,
    sendMessage,
    onNewMessage,
    onMessageSent,
    onUserStatus,
    onError,
    reconnect,
  };

  return <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>;
};

/**
 * Hook to access chat context
 */
export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
