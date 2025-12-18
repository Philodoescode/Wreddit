/**
 * Chat WebSocket Message Types
 * These types align with the backend WebSocket events
 */

// Message sent from client to server
export interface SendMessagePayload {
  recipientId: string;
  text: string;
}

// Message received from server (new incoming message)
export interface NewMessagePayload {
  sender_id: string;
  text: string;
  message_id: string;
  timestamp: string;
}

// Acknowledgment from server when message is sent successfully
export interface MessageSentPayload {
  messageId: string;
  conversationId: string;
  text: string;
  recipientId: string;
  created_at: string;
}

// User presence status update
export interface UserStatusPayload {
  userId: string;
  status: "online" | "offline";
}

// Error payload from server
export interface ErrorPayload {
  code: string;
  message: string;
}

// Connected event when WebSocket establishes connection
export interface ConnectedPayload {
  userId: string;
}

// WebSocket message envelope types
export type WebSocketMessage =
  | { type: "SEND_MESSAGE"; payload: SendMessagePayload }
  | { type: "NEW_MESSAGE"; payload: NewMessagePayload }
  | { type: "MESSAGE_SENT"; payload: MessageSentPayload }
  | { type: "USER_STATUS"; payload: UserStatusPayload }
  | { type: "ERROR"; payload: ErrorPayload }
  | { type: "connected"; userId: string };

// Conversation data from API (matches backend schema)
export interface Conversation {
  _id: string;
  participants: Array<{
    _id: string;
    username: string;
    userPhotoUrl?: string;
  }>;
  last_message: string; // Backend stores as plain string
  updated_at: string;
  created_at: string;
}

// User search result from /api/search
export interface UserSearchResult {
  _id: string;
  username: string;
  userPhotoUrl?: string;
}

// Standard API response wrapper
export interface ApiResponse<T> {
  status: "success" | "fail";
  data?: T;
  message?: string;
}

// Chat context state
export interface ChatContextState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  sendMessage: (recipientId: string, text: string) => void;
  onNewMessage: (handler: (message: NewMessagePayload) => void) => () => void;
  onMessageSent: (handler: (ack: MessageSentPayload) => void) => () => void;
  onUserStatus: (handler: (status: UserStatusPayload) => void) => () => void;
  onError: (handler: (error: ErrorPayload) => void) => () => void;
  reconnect: () => void;
}
