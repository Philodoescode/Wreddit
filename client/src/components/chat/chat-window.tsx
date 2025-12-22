import { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare } from "lucide-react";
import { MessageFeed } from "./message-feed";
import { MessageInput } from "./message-input";
import { OnlineAvatar } from "./online-avatar";
import { TypingIndicator } from "./typing-indicator";
import { useChat } from "@/context/chat-provider";
import type { Conversation, TypingEventPayload } from "@/types/chat.types";

interface ChatWindowProps {
  conversation: Conversation | null;
  currentUserId: string;
  isOnline?: boolean;
  onConversationResolved?: (pendingId: string, realId: string) => void;
}

// Timing constants (in ms)
const DEBOUNCE_SHOW_MS = 600;      // Wait before showing indicator
const MIN_VISIBLE_MS = 800;        // Minimum time indicator stays visible
const AUTO_HIDE_MS = 5000;         // Hide after no typing events

interface TypingState {
  userName: string;
  showTimeoutId: ReturnType<typeof setTimeout> | null;
  hideTimeoutId: ReturnType<typeof setTimeout> | null;
  visibleSince: number | null;
}

export function ChatWindow({ conversation, currentUserId, isOnline = false, onConversationResolved }: ChatWindowProps) {
  const { sendMessage, sendTypingStart, sendTypingStop, onUserTyping, onUserStoppedTyping, isConnected } = useChat();
  
  // Typing indicator state
  const [isTypingVisible, setIsTypingVisible] = useState(false);
  const [typingUserName, setTypingUserName] = useState("");
  const typingStateRef = useRef<TypingState>({
    userName: "",
    showTimeoutId: null,
    hideTimeoutId: null,
    visibleSince: null,
  });

  // Get other participant info
  const otherParticipant = conversation?.participants.find(
    (p) => p._id !== currentUserId
  );

  // Clear all typing timeouts
  const clearTypingTimeouts = useCallback(() => {
    const state = typingStateRef.current;
    if (state.showTimeoutId) {
      clearTimeout(state.showTimeoutId);
      state.showTimeoutId = null;
    }
    if (state.hideTimeoutId) {
      clearTimeout(state.hideTimeoutId);
      state.hideTimeoutId = null;
    }
  }, []);

  // Hide indicator with minimum visible time respect
  const hideIndicator = useCallback(() => {
    const state = typingStateRef.current;
    const visibleSince = state.visibleSince;
    
    if (visibleSince) {
      const visibleDuration = Date.now() - visibleSince;
      if (visibleDuration < MIN_VISIBLE_MS) {
        // Wait for minimum visible time
        const remainingTime = MIN_VISIBLE_MS - visibleDuration;
        state.hideTimeoutId = setTimeout(() => {
          setIsTypingVisible(false);
          state.visibleSince = null;
        }, remainingTime);
        return;
      }
    }
    
    setIsTypingVisible(false);
    state.visibleSince = null;
  }, []);

  // Show indicator with debounce
  const showIndicator = useCallback((userName: string) => {
    const state = typingStateRef.current;
    
    // Clear any pending hide timeout
    if (state.hideTimeoutId) {
      clearTimeout(state.hideTimeoutId);
      state.hideTimeoutId = null;
    }

    // If already visible, just reset auto-hide timer
    if (isTypingVisible) {
      state.hideTimeoutId = setTimeout(hideIndicator, AUTO_HIDE_MS);
      return;
    }

    // If a show is already pending, don't restart the debounce
    if (state.showTimeoutId) {
      return;
    }

    // Debounce the show
    state.userName = userName;
    state.showTimeoutId = setTimeout(() => {
      setTypingUserName(userName);
      setIsTypingVisible(true);
      state.visibleSince = Date.now();
      state.showTimeoutId = null;
      
      // Set up auto-hide
      state.hideTimeoutId = setTimeout(hideIndicator, AUTO_HIDE_MS);
    }, DEBOUNCE_SHOW_MS);
  }, [isTypingVisible, hideIndicator]);

  // Handle typing events
  useEffect(() => {
    if (!conversation) return;

    const handleUserTyping = (event: TypingEventPayload) => {
      // Ignore self-typing
      if (event.userId === currentUserId) return;
      
      // Only handle events for current conversation
      // For pending conversations, match by recipientId
      const conversationMatches = 
        event.conversationId === conversation._id ||
        (conversation._id.startsWith("pending_") && otherParticipant && event.userId === otherParticipant._id);
      
      if (!conversationMatches) return;

      const userName = otherParticipant?.username || "Someone";
      showIndicator(userName);
    };

    const handleUserStoppedTyping = (event: TypingEventPayload) => {
      // Ignore self-typing
      if (event.userId === currentUserId) return;
      
      // Only handle events for current conversation
      const conversationMatches = 
        event.conversationId === conversation._id ||
        (conversation._id.startsWith("pending_") && otherParticipant && event.userId === otherParticipant._id);
      
      if (!conversationMatches) return;

      hideIndicator();
    };

    const unsubscribeTyping = onUserTyping(handleUserTyping);
    const unsubscribeStoppedTyping = onUserStoppedTyping(handleUserStoppedTyping);

    return () => {
      unsubscribeTyping();
      unsubscribeStoppedTyping();
    };
  }, [conversation, currentUserId, otherParticipant, onUserTyping, onUserStoppedTyping, showIndicator, hideIndicator]);

  // Clear typing state when conversation changes
  useEffect(() => {
    clearTypingTimeouts();
    setIsTypingVisible(false);
    setTypingUserName("");
    typingStateRef.current.visibleSince = null;
  }, [conversation?._id, clearTypingTimeouts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTypingTimeouts();
    };
  }, [clearTypingTimeouts]);

  // Empty state when no conversation selected
  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-muted/30">
        <MessageSquare className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-1">
          Select a chat to start messaging
        </h3>
        <p className="text-sm text-muted-foreground/70">
          Choose a conversation from the sidebar
        </p>
      </div>
    );
  }

  if (!otherParticipant) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Invalid conversation
      </div>
    );
  }

  const handleSendMessage = (text: string) => {
    // Use MessageFeed's sendMessage which includes optimistic UI updates
    const chatSendMessage = (window as any).__chatSendMessage;
    if (chatSendMessage) {
      chatSendMessage(text);
    } else {
      // Fallback to direct send if MessageFeed not mounted
      sendMessage(otherParticipant._id, text);
    }
  };

  const handleTypingStart = () => {
    sendTypingStart(otherParticipant._id, conversation._id);
  };

  const handleTypingStop = () => {
    sendTypingStop(otherParticipant._id, conversation._id);
  };

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden min-h-0">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-background">
        <OnlineAvatar
          userId={otherParticipant._id}
          username={otherParticipant.username}
          userPhotoUrl={otherParticipant.userPhotoUrl}
          isOnline={isOnline}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">
            {otherParticipant.username}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* Message feed */}
      <MessageFeed
        conversationId={conversation._id}
        recipientId={otherParticipant._id}
        onConversationResolved={onConversationResolved}
      />

      {/* Typing indicator */}
      <TypingIndicator
        typingUserName={typingUserName}
        isVisible={isTypingVisible}
      />

      {/* Message input */}
      <MessageInput
        onSend={handleSendMessage}
        disabled={!isConnected}
        placeholder={
          isConnected
            ? `Message ${otherParticipant.username}...`
            : "Connecting..."
        }
        recipientId={otherParticipant._id}
        conversationId={conversation._id}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
      />
    </div>
  );
}

