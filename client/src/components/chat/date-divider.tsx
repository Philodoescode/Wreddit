import { cn } from "@/lib/utils";

interface DateDividerProps {
  date: Date;
  className?: string;
}

/**
 * Format date for display in chat
 * Returns "Today", "Yesterday", or "MMM dd, yyyy"
 */
export function formatDateLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (inputDate.getTime() === today.getTime()) {
    return "Today";
  } else if (inputDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: inputDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
}

export function DateDivider({ date, className }: DateDividerProps) {
  return (
    <div className={cn("flex items-center gap-4 py-4", className)}>
      <div className="flex-1 border-t border-border" />
      <span className="text-xs text-muted-foreground font-medium px-2">
        {formatDateLabel(date)}
      </span>
      <div className="flex-1 border-t border-border" />
    </div>
  );
}
