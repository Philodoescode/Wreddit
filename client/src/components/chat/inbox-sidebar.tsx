import { useState, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";
import { ConversationListItem } from "./conversation-list-item";
import { NewChatDialog } from "./new-chat-dialog";
import { chatService } from "@/lib/chat-service";
import { useChat } from "@/context/chat-provider";
import { useAuth } from "@/context/auth-provider";
import type { Conversation } from "@/types/chat.types";

interface InboxSidebarProps {
  selectedConversationId?: string;
  onConversationSelect: (conversationId: string) => void;
}

export function InboxSidebar({
  selectedConversationId,
  onConversationSelect,
}: InboxSidebarProps) {
  const { user } = useAuth();
  const { onNewMessage, onMessageSent, onUserStatus } = useChat();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Map<string, boolean>>(new Map());

  // Fetch conversations on mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await chatService.getConversations();
        setConversations(data);
      } catch (err) {
        console.error("Failed to fetch conversations:", err);
        setError("Failed to load conversations");
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, []);

  // Handle new message received
  useEffect(() => {
    const unsubscribe = onNewMessage((message) => {
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          // Check if sender is in this conversation
          const senderInConv = conv.participants.some(
            (p) => p._id === message.sender_id
          );
          
          if (senderInConv) {
            return {
              ...conv,
              last_message: message.text,
              updated_at: message.timestamp,
            };
          }
          return conv;
        });

        // Sort by updated_at descending
        return updated.sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      });
    });

    return unsubscribe;
  }, [onNewMessage]);

  // Handle message sent (update own messages)
  useEffect(() => {
    const unsubscribe = onMessageSent((ack) => {
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv._id === ack.conversationId) {
            return {
              ...conv,
              last_message: ack.text,
              updated_at: ack.created_at,
            };
          }
          return conv;
        });

        // Sort by updated_at descending
        return updated.sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      });
    });

    return unsubscribe;
  }, [onMessageSent]);

  // Handle user status updates
  useEffect(() => {
    const unsubscribe = onUserStatus((status) => {
      setOnlineUsers((prev) => {
        const updated = new Map(prev);
        updated.set(status.userId, status.status === "online");
        return updated;
      });
    });

    return unsubscribe;
  }, [onUserStatus]);

  // Handle user selection from new chat dialog
  const handleUserSelect = useCallback(
    (userId: string) => {
      // Find existing conversation with this user
      const existingConv = conversations.find((conv) =>
        conv.participants.some((p) => p._id === userId)
      );

      if (existingConv) {
        // Select existing conversation
        onConversationSelect(existingConv._id);
      } else {
        // In Phase 3, we'll create a new conversation
        // For now, just log it
        console.log("Start new conversation with user:", userId);
      }
    },
    [conversations, onConversationSelect]
  );

  // Get online status for a user
  const isUserOnline = (userId: string) => {
    return onlineUsers.get(userId) || false;
  };

  return (
    <div className="flex flex-col h-full border-r bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Messages</h2>
        <NewChatDialog
          onlineUsers={onlineUsers}
          onUserSelect={handleUserSelect}
        />
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>{error}</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium mb-1">No conversations yet</h3>
            <p className="text-sm text-muted-foreground">
              Start a new chat to get started
            </p>
          </div>
        ) : (
          <div className="p-2">
            {conversations.map((conversation) => {
              const otherParticipant = conversation.participants.find(
                (p) => p._id !== user?.id
              );
              return (
                <ConversationListItem
                  key={conversation._id}
                  conversation={conversation}
                  isActive={selectedConversationId === conversation._id}
                  isOnline={
                    otherParticipant ? isUserOnline(otherParticipant._id) : false
                  }
                  currentUserId={user?.id || ""}
                  onClick={() => onConversationSelect(conversation._id)}
                />
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
