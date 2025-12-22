import { formatDistanceToNow } from "date-fns";
import { OnlineAvatar } from "./online-avatar";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types/chat.types";

interface ConversationListItemProps {
  conversation: Conversation;
  isActive?: boolean;
  isOnline?: boolean;
  currentUserId: string;
  onClick: () => void;
}

export function ConversationListItem({
  conversation,
  isActive = false,
  isOnline = false,
  currentUserId,
  onClick,
}: ConversationListItemProps) {
  // Get the other participant (not the current user)
  const otherParticipant = conversation.participants.find(
    (p) => p._id !== currentUserId
  );

  if (!otherParticipant) return null;

  // Truncate last message
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  // Format last message with sender prefix
  const formatLastMessage = () => {
    if (!conversation.last_message) {
      return "No messages yet";
    }

    const sender = conversation.last_message_sender;
    const truncatedMessage = truncateText(conversation.last_message, 40);

    if (!sender) {
      // Fallback for old conversations without sender info
      return truncatedMessage;
    }

    const senderPrefix = sender._id === currentUserId ? "You" : sender.username;
    return `${senderPrefix}: ${truncatedMessage}`;
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
        "hover:bg-accent",
        isActive && "bg-accent"
      )}
    >
      <OnlineAvatar
        userId={otherParticipant._id}
        username={otherParticipant.username}
        userPhotoUrl={otherParticipant.userPhotoUrl}
        isOnline={isOnline}
        size="md"
      />

      <div className="flex-1 min-w-0">
        {/* Username */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm truncate">
            {otherParticipant.username}
          </span>
          {/* Timestamp */}
          <span className="text-xs text-muted-foreground shrink-0">
            {formatDistanceToNow(new Date(conversation.updated_at), {
              addSuffix: false,
            })}
          </span>
        </div>

        {/* Last message preview with sender */}
        <p className="text-sm text-muted-foreground truncate">
          {formatLastMessage()}
        </p>
      </div>
    </button>
  );
}
