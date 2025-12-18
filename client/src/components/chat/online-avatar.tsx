import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface OnlineAvatarProps {
  userId: string;
  username: string;
  userPhotoUrl?: string;
  isOnline?: boolean;
  size?: "sm" | "md" | "lg";
}

export function OnlineAvatar({
  username,
  userPhotoUrl,
  isOnline = false,
  size = "md",
}: OnlineAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const dotSizeClasses = {
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3",
  };

  // Get initials from username
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative inline-block">
      <Avatar className={cn(sizeClasses[size])}>
        <AvatarImage src={userPhotoUrl} alt={username} />
        <AvatarFallback className="bg-primary/10 text-primary font-medium">
          {getInitials(username)}
        </AvatarFallback>
      </Avatar>
      {/* Online status indicator */}
      <span
        className={cn(
          "absolute bottom-0 right-0 block rounded-full ring-2 ring-background",
          dotSizeClasses[size],
          isOnline ? "bg-emerald-500" : "bg-gray-400"
        )}
      />
    </div>
  );
}
