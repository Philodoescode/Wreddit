import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Message } from "@/types/chat.types";

interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
  showAvatar?: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
}

/**
 * Format timestamp for display
 */
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function MessageBubble({
  message,
  isSent,
  showAvatar = true,
  isFirstInGroup = true,
  isLastInGroup = true,
}: MessageBubbleProps) {
  const sender = message.sender_id;
  const initials = sender.username?.slice(0, 2).toUpperCase() || "??";

  return (
    <div
      className={cn(
        "flex gap-2 px-4",
        isSent ? "flex-row-reverse" : "flex-row",
        !isFirstInGroup && "pt-0.5",
        isFirstInGroup && "pt-2"
      )}
    >
      {/* Avatar - only show for received messages when showAvatar is true */}
      {!isSent && (
        <div className="w-8 shrink-0">
          {showAvatar && isLastInGroup ? (
            <Avatar className="h-8 w-8">
              <AvatarImage src={sender.userPhotoUrl} alt={sender.username} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          ) : null}
        </div>
      )}

      {/* Message bubble */}
      <div
        className={cn(
          "max-w-[70%] px-3 py-2 text-sm",
          isSent
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
          // Rounded corners based on position in group
          isFirstInGroup && isLastInGroup && "rounded-2xl",
          isFirstInGroup && !isLastInGroup && (isSent ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-bl-md"),
          !isFirstInGroup && isLastInGroup && (isSent ? "rounded-2xl rounded-tr-md" : "rounded-2xl rounded-tl-md"),
          !isFirstInGroup && !isLastInGroup && (isSent ? "rounded-2xl rounded-r-md" : "rounded-2xl rounded-l-md")
        )}
      >
        <p className="break-words whitespace-pre-wrap">{message.text}</p>
      </div>

      {/* Timestamp - show on last message in group */}
      {isLastInGroup && (
        <div
          className={cn(
            "flex items-end pb-1",
            isSent ? "pr-1" : "pl-1"
          )}
        >
          <span className="text-[10px] text-muted-foreground">
            {formatTime(message.created_at)}
          </span>
        </div>
      )}
    </div>
  );
}
