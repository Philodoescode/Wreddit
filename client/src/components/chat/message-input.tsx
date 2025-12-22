import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  recipientId?: string;
  conversationId?: string;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

// Throttle typing events to once per 3 seconds
const TYPING_THROTTLE_MS = 3000;

export function MessageInput({
  onSend,
  disabled = false,
  placeholder = "Type a message...",
  className,
  onTypingStart,
  onTypingStop,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isTypingRef = useRef(false);
  const lastTypingEventRef = useRef<number>(0);

  // Send typing_stop on unmount if still typing
  useEffect(() => {
    return () => {
      if (isTypingRef.current && onTypingStop) {
        onTypingStop();
      }
    };
  }, [onTypingStop]);

  const handleTypingStart = () => {
    const now = Date.now();
    // Throttle: only emit if 3s have passed since last event
    if (now - lastTypingEventRef.current >= TYPING_THROTTLE_MS) {
      lastTypingEventRef.current = now;
      isTypingRef.current = true;
      onTypingStart?.();
    }
  };

  const handleTypingStop = () => {
    if (isTypingRef.current) {
      isTypingRef.current = false;
      lastTypingEventRef.current = 0;
      onTypingStop?.();
    }
  };

  const handleSend = () => {
    const trimmedText = text.trim();
    if (trimmedText && !disabled) {
      // Stop typing before sending
      handleTypingStop();
      onSend(trimmedText);
      setText("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);

    // Trigger typing start if text is not empty
    if (newText.trim() && onTypingStart) {
      handleTypingStart();
    } else if (!newText.trim()) {
      // Stop typing if text is cleared
      handleTypingStop();
    }
  };

  const handleBlur = () => {
    // Stop typing when input loses focus
    handleTypingStop();
  };

  const handleInput = () => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className={cn("flex items-end gap-2 p-4 border-t bg-background", className)}>
      <Textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className="min-h-[40px] max-h-[120px] resize-none"
        rows={1}
      />
      <Button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        size="icon"
        className="shrink-0 h-10 w-10"
      >
        <Send className="h-4 w-4" />
        <span className="sr-only">Send message</span>
      </Button>
    </div>
  );
}

