import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { InboxSidebar } from "@/components/chat/inbox-sidebar";
import { ChatWindow } from "@/components/chat/chat-window";
import { chatService } from "@/lib/chat-service";
import { useChat } from "@/context/chat-provider";
import { useAuth } from "@/context/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";
import ThemeToggle from "@/components/theme-toggle";
import type { Conversation } from "@/types/chat.types";

export default function ChatPage() {
  const { user } = useAuth();
  const { onUserStatus } = useChat();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | undefined
  >(undefined);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Map<string, boolean>>(new Map());

  // Handle newChat query param for profile page integration
  useEffect(() => {
    const newChatUserId = searchParams.get("newChat");
    if (newChatUserId && conversations.length > 0) {
      // Try to find existing conversation with this user
      const existingConv = conversations.find((c) =>
        c.participants.some((p) => p._id === newChatUserId)
      );
      if (existingConv) {
        setSelectedConversationId(existingConv._id);
      }
      // Clear the query param
      searchParams.delete("newChat");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, conversations]);

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

  // Callback when a new conversation is created (from NewChatDialog)
  const handleConversationCreated = useCallback((conversation: Conversation) => {
    setConversations((prev) => {
      // Check if already exists
      if (prev.some((c) => c._id === conversation._id)) {
        return prev;
      }
      return [conversation, ...prev];
    });
    setSelectedConversationId(conversation._id);
  }, []);

  return (
    <ThemeProvider>
      <div className="flex flex-col h-screen bg-background">
        {/* Header with logo */}
        <header className="flex items-center justify-between h-14 px-4 border-b bg-background shrink-0">
          <Link to="/" className="flex items-center gap-2 text-primary hover:text-primary/90">
            <img
              src="/Reddit_Symbol_23.svg"
              alt="Wreddit"
              className="h-8 w-auto"
            />
            <span className="font-semibold text-lg hidden sm:inline">wreddit</span>
          </Link>
          <ThemeToggle />
        </header>

        {/* Main chat area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Inbox Sidebar */}
          <div className="w-80 shrink-0 border-r">
            <InboxSidebar
              selectedConversationId={selectedConversationId}
              onConversationSelect={handleConversationSelect}
              onConversationCreated={handleConversationCreated}
            />
          </div>

          {/* Right: Chat Window */}
          <ChatWindow
            conversation={selectedConversation}
            currentUserId={user?.id || ""}
            isOnline={getOtherParticipantOnlineStatus()}
          />
        </div>
      </div>
    </ThemeProvider>
  );
}
