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
    if (!text) return "No messages yet";
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
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

        {/* Last message preview */}
        <p className="text-sm text-muted-foreground truncate">
          {truncateText(conversation.last_message, 50)}
        </p>
      </div>
    </button>
  );
}
