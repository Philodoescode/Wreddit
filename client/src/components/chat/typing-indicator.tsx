import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  typingUserName: string;
  isVisible: boolean;
  className?: string;
}

/**
 * Typing indicator component with three-dot pulsing animation
 * Includes accessibility support with ARIA live region
 */
export function TypingIndicator({
  typingUserName,
  isVisible,
  className,
}: TypingIndicatorProps) {
  if (!isVisible) {
    return (
      // Hidden live region for screen reader announcements
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {/* Empty when not typing */}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 h-6 px-4 text-sm text-muted-foreground",
        "animate-in fade-in slide-in-from-bottom-2 duration-200",
        className
      )}
    >
      {/* Animated dots */}
      <div className="flex items-center gap-0.5" aria-hidden="true">
        <span className="typing-dot typing-dot-1" />
        <span className="typing-dot typing-dot-2" />
        <span className="typing-dot typing-dot-3" />
      </div>

      {/* Visible text */}
      <span className="text-xs">{typingUserName} is typing…</span>

      {/* Screen reader announcement */}
      <span
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {typingUserName} is typing
      </span>

      {/* Embedded CSS for animation - respects prefers-reduced-motion */}
      <style>{`
        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: currentColor;
          opacity: 0.6;
          animation: typing-pulse 1.4s ease-in-out infinite;
        }

        .typing-dot-1 {
          animation-delay: 0s;
        }

        .typing-dot-2 {
          animation-delay: 0.2s;
        }

        .typing-dot-3 {
          animation-delay: 0.4s;
        }

        @keyframes typing-pulse {
          0%, 60%, 100% {
            opacity: 0.4;
            transform: scale(0.8);
          }
          30% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .typing-dot {
            animation: none;
            opacity: 0.6;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
