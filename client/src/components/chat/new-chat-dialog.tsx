import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { OnlineAvatar } from "./online-avatar";
import { chatService } from "@/lib/chat-service";
import type { UserSearchResult } from "@/types/chat.types";

interface NewChatDialogProps {
  onlineUsers: Map<string, boolean>;
  onUserSelect: (user: UserSearchResult) => void;
}

export function NewChatDialog({ onlineUsers, onUserSelect }: NewChatDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsLoading(true);
        try {
          const results = await chatService.searchUsers(searchQuery);
          setSearchResults(results);
        } catch (error) {
          console.error("Failed to search users:", error);
          setSearchResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleUserSelect = (user: UserSearchResult) => {
    onUserSelect(user);
    setOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Start a new chat</DialogTitle>
        </DialogHeader>
        <Command className="rounded-lg border shadow-md">
          <CommandInput
            placeholder="Search users..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {isLoading ? (
              <div className="p-4 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : searchQuery && searchResults.length === 0 ? (
              <CommandEmpty>No users found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {searchResults.map((user) => (
                  <CommandItem
                    key={user._id}
                    value={user.username}
                    onSelect={() => handleUserSelect(user)}
                    className="flex items-center gap-3 p-2 cursor-pointer"
                  >
                    <OnlineAvatar
                      userId={user._id}
                      username={user.username}
                      userPhotoUrl={user.userPhotoUrl}
                      isOnline={onlineUsers.get(user._id) || false}
                      size="sm"
                    />
                    <span className="font-medium">{user.username}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
