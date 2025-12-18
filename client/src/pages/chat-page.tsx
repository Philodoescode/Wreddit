import { useState, useEffect, useCallback } from "react";
import { InboxSidebar } from "@/components/chat/inbox-sidebar";
import { ChatWindow } from "@/components/chat/chat-window";
import { chatService } from "@/lib/chat-service";
import { useChat } from "@/context/chat-provider";
import { useAuth } from "@/context/auth-provider";
import type { Conversation } from "@/types/chat.types";

export default function ChatPage() {
  const { user } = useAuth();
  const { onUserStatus } = useChat();
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | undefined
  >(undefined);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Map<string, boolean>>(new Map());

  // Fetch conversations on mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await chatService.getConversations();
        setConversations(data);
      } catch (err) {
        console.error("Failed to fetch conversations:", err);
      }
    };

    fetchConversations();
  }, []);

  // Track online status
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

  // Get selected conversation object
  const selectedConversation = conversations.find(
    (c) => c._id === selectedConversationId
  ) || null;

  // Get online status for the other participant
  const getOtherParticipantOnlineStatus = useCallback(() => {
    if (!selectedConversation || !user) return false;
    const other = selectedConversation.participants.find(
      (p) => p._id !== user.id
    );
    return other ? onlineUsers.get(other._id) || false : false;
  }, [selectedConversation, user, onlineUsers]);

  // Handle conversation selection and update local state if needed
  const handleConversationSelect = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
  }, []);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left: Inbox Sidebar */}
      <div className="w-80 shrink-0">
        <InboxSidebar
          selectedConversationId={selectedConversationId}
          onConversationSelect={handleConversationSelect}
        />
      </div>

      {/* Right: Chat Window */}
      <ChatWindow
        conversation={selectedConversation}
        currentUserId={user?.id || ""}
        isOnline={getOtherParticipantOnlineStatus()}
      />
    </div>
  );
}

