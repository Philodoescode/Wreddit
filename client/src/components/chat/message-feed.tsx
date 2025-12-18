import { useState, useEffect, useRef, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { MessageBubble } from "./message-bubble";
import { DateDivider } from "./date-divider";
import { chatService } from "@/lib/chat-service";
import { useChat } from "@/context/chat-provider";
import { useAuth } from "@/context/auth-provider";
import type { Message } from "@/types/chat.types";

interface MessageFeedProps {
  conversationId: string;
  recipientId: string;
}

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
function groupMessages(messages: Message[], currentUserId: string) {
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
  const { onNewMessage, onMessageSent } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

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

  // Scroll to bottom on initial load or new messages
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
        const newMessage: Message = {
          _id: payload.message_id,
          conversation_id: conversationId,
          sender_id: {
            _id: payload.sender_id,
            username: "", // Will be populated from context if needed
          },
          text: payload.text,
          created_at: payload.timestamp,
        };
        setMessages((prev) => [...prev, newMessage]);
        // Scroll to bottom for new messages
        setTimeout(() => {
          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    });

    return unsubscribe;
  }, [onNewMessage, conversationId, recipientId]);

  // Handle sent message acknowledgment
  useEffect(() => {
    const unsubscribe = onMessageSent((ack) => {
      if (ack.conversationId === conversationId) {
        const newMessage: Message = {
          _id: ack.messageId,
          conversation_id: ack.conversationId,
          sender_id: {
            _id: user?.id || "",
            username: user?.username || "",
          },
          text: ack.text,
          created_at: ack.created_at,
        };
        setMessages((prev) => [...prev, newMessage]);
        // Scroll to bottom for sent messages
        setTimeout(() => {
          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
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
              />
            </div>
          ))
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
