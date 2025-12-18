import { useState, useEffect, useRef, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronDown } from "lucide-react";
import { MessageBubble } from "./message-bubble";
import { DateDivider } from "./date-divider";
import { chatService } from "@/lib/chat-service";
import { useChat } from "@/context/chat-provider";
import { useAuth } from "@/context/auth-provider";
import type { Message, MessageStatus } from "@/types/chat.types";

interface MessageFeedProps {
  conversationId: string;
  recipientId: string;
}

// Unified message type for display
type DisplayMessage = (Message & { localId?: string; status?: MessageStatus });

/**
 * Check if two dates are on the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Process messages to add grouping information
 */
function groupMessages(messages: DisplayMessage[], currentUserId: string) {
  return messages.map((message, index) => {
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;

    const currentDate = new Date(message.created_at);
    const prevDate = prevMessage ? new Date(prevMessage.created_at) : null;

    // Show date divider if first message or different day from previous
    const showDateDivider = !prevDate || !isSameDay(currentDate, prevDate);

    // Check if same sender as previous/next for grouping
    const sameSenderAsPrev = prevMessage && prevMessage.sender_id._id === message.sender_id._id && !showDateDivider;
    const sameSenderAsNext = nextMessage && nextMessage.sender_id._id === message.sender_id._id && 
      isSameDay(currentDate, new Date(nextMessage.created_at));

    const isSent = message.sender_id._id === currentUserId;
    const isFirstInGroup = !sameSenderAsPrev;
    const isLastInGroup = !sameSenderAsNext;
    const showAvatar = !isSent && isLastInGroup;

    return {
      message,
      showDateDivider,
      isSent,
      isFirstInGroup,
      isLastInGroup,
      showAvatar,
    };
  });
}

export function MessageFeed({ conversationId, recipientId }: MessageFeedProps) {
  const { user } = useAuth();
  const { onNewMessage, onMessageSent, sendMessage } = useChat();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Smart scroll state
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);
  const pendingMessages = useRef<Map<string, { text: string; recipientId: string }>>(new Map());

  // Generate unique local ID
  const generateLocalId = () => `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Handle scroll to detect if user is at bottom
  const handleScroll = useCallback((event: Event) => {
    const target = event.target as HTMLElement;
    if (!target) return;
    
    const threshold = 100; // pixels from bottom
    const atBottom = target.scrollHeight - target.scrollTop - target.clientHeight < threshold;
    setIsAtBottom(atBottom);
    
    if (atBottom) {
      setNewMessageCount(0);
      setShowScrollButton(false);
    }
  }, []);

  // Attach scroll listener
  useEffect(() => {
    const scrollViewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollViewport) {
      scrollViewport.addEventListener('scroll', handleScroll);
      return () => scrollViewport.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll, isLoading]);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setNewMessageCount(0);
    setShowScrollButton(false);
  }, []);

  // Send message with optimistic UI
  const handleSendMessage = useCallback((text: string) => {
    if (!user) return;
    
    const localId = generateLocalId();
    const optimisticMessage: DisplayMessage = {
      _id: localId,
      conversation_id: conversationId,
      sender_id: {
        _id: user.id,
        username: user.username,
      },
      text,
      created_at: new Date().toISOString(),
      localId,
      status: "sending" as MessageStatus,
    };

    // Store pending message for matching with acknowledgment
    pendingMessages.current.set(localId, { text, recipientId });
    
    // Add optimistic message to UI
    setMessages((prev) => [...prev, optimisticMessage]);
    
    // Scroll to bottom for own messages
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    
    // Send via WebSocket
    sendMessage(recipientId, text);
  }, [user, conversationId, recipientId, sendMessage]);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        setError(null);
        isFirstLoad.current = true;
        const response = await chatService.getMessages(conversationId);
        // Messages come in desc order, reverse for display (oldest first)
        setMessages(response.messages.reverse());
        setNextCursor(response.nextCursor);
        setHasMore(response.hasMore);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
        setError("Failed to load messages");
      } finally {
        setIsLoading(false);
      }
    };

    if (conversationId) {
      fetchMessages();
    }
  }, [conversationId]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!isLoading && isFirstLoad.current) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
      isFirstLoad.current = false;
    }
  }, [isLoading, messages]);

  // Handle new incoming messages
  useEffect(() => {
    const unsubscribe = onNewMessage((payload) => {
      // Only add if it's from the current conversation's recipient
      if (payload.sender_id === recipientId) {
        const newMessage: DisplayMessage = {
          _id: payload.message_id,
          conversation_id: conversationId,
          sender_id: {
            _id: payload.sender_id,
            username: "", // Will be populated from context if needed
          },
          text: payload.text,
          created_at: payload.timestamp,
          status: "sent",
        };
        setMessages((prev) => [...prev, newMessage]);
        
        // Smart scroll: only auto-scroll if at bottom
        if (isAtBottom) {
          setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        } else {
          // Show scroll button and increment counter
          setNewMessageCount((prev) => prev + 1);
          setShowScrollButton(true);
        }
      }
    });

    return unsubscribe;
  }, [onNewMessage, conversationId, recipientId, isAtBottom]);

  // Handle sent message acknowledgment - update optimistic message
  useEffect(() => {
    const unsubscribe = onMessageSent((ack) => {
      if (ack.conversationId === conversationId) {
        setMessages((prev) => {
          // Find and update the optimistic message
          const updated = prev.map((msg) => {
            // Match by text and pending status (simple matching)
            if (msg.status === "sending" && msg.text === ack.text) {
              return {
                ...msg,
                _id: ack.messageId,
                created_at: ack.created_at,
                status: "sent" as MessageStatus,
              };
            }
            return msg;
          });
          return updated;
        });
      }
    });

    return unsubscribe;
  }, [onMessageSent, conversationId, user]);

  // Load more messages (older)
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !nextCursor) return;

    try {
      setIsLoadingMore(true);
      const response = await chatService.getMessages(conversationId, nextCursor);
      // Prepend older messages (they come in desc order, reverse them)
      setMessages((prev) => [...response.messages.reverse(), ...prev]);
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
    } catch (err) {
      console.error("Failed to load more messages:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [conversationId, hasMore, isLoadingMore, nextCursor]);

  // Expose sendMessage to parent via callback
  useEffect(() => {
    // Store handleSendMessage in a ref accessible externally
    (window as any).__chatSendMessage = handleSendMessage;
    return () => {
      delete (window as any).__chatSendMessage;
    };
  }, [handleSendMessage]);

  if (isLoading) {
    return (
      <div className="flex-1 p-4 space-y-4">
        <Skeleton className="h-10 w-48 ml-auto" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-56 ml-auto" />
        <Skeleton className="h-10 w-72" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p>{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const groupedMessages = groupMessages(messages, user?.id || "");

  return (
    <div className="relative flex-1 flex flex-col">
      <ScrollArea ref={scrollAreaRef} className="flex-1">
        <div className="py-4">
          {/* Load more button */}
          {hasMore && (
            <div className="flex justify-center pb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load earlier messages"
                )}
              </Button>
            </div>
          )}

          {/* Messages */}
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              No messages yet. Send a message to start the conversation!
            </div>
          ) : (
            groupedMessages.map(({
              message,
              showDateDivider,
              isSent,
              isFirstInGroup,
              isLastInGroup,
              showAvatar,
            }) => (
              <div key={message._id}>
                {showDateDivider && (
                  <DateDivider date={new Date(message.created_at)} />
                )}
                <MessageBubble
                  message={message}
                  isSent={isSent}
                  showAvatar={showAvatar}
                  isFirstInGroup={isFirstInGroup}
                  isLastInGroup={isLastInGroup}
                  status={message.status}
                />
              </div>
            ))
          )}

          {/* Scroll anchor */}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Floating scroll to bottom button */}
      {showScrollButton && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <Button
            onClick={scrollToBottom}
            size="sm"
            className="rounded-full shadow-lg gap-1"
          >
            <ChevronDown className="h-4 w-4" />
            {newMessageCount > 0 ? (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                {newMessageCount}
              </Badge>
            ) : (
              "Scroll to bottom"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
