import { MessageSquare } from "lucide-react";
import { MessageFeed } from "./message-feed";
import { MessageInput } from "./message-input";
import { OnlineAvatar } from "./online-avatar";
import { useChat } from "@/context/chat-provider";
import type { Conversation } from "@/types/chat.types";

interface ChatWindowProps {
  conversation: Conversation | null;
  currentUserId: string;
  isOnline?: boolean;
  onConversationResolved?: (pendingId: string, realId: string) => void;
}

export function ChatWindow({ conversation, currentUserId, isOnline = false, onConversationResolved }: ChatWindowProps) {
  const { sendMessage, isConnected } = useChat();

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

  // Get the other participant
  const otherParticipant = conversation.participants.find(
    (p) => p._id !== currentUserId
  );

  if (!otherParticipant) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Invalid conversation
      </div>
    );
  }

  const handleSendMessage = (text: string) => {
    sendMessage(otherParticipant._id, text);
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
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

      {/* Message input */}
      <MessageInput
        onSend={handleSendMessage}
        disabled={!isConnected}
        placeholder={
          isConnected
            ? `Message ${otherParticipant.username}...`
            : "Connecting..."
        }
      />
    </div>
  );
}
