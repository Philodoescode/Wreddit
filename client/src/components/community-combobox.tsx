"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/context/auth-provider";

interface Community {
  _id: string;
  name: string;
  title: string;
  iconImage?: string;
  memberCount?: number;
}

interface CommunityComboboxProps {
  value: Community | null;
  onChange: (community: Community | null) => void;
}

export default function CommunityCombobox({
  value,
  onChange,
}: CommunityComboboxProps) {
  const { token } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [communities, setCommunities] = React.useState<Community[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch all communities on mount
  React.useEffect(() => {
    const fetchCommunities = async () => {
      if (!token) return;

      setIsLoading(true);
      try {
        const response = await fetch("http://localhost:5000/api/communities", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCommunities(data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch communities:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommunities();
  }, [token]);

  // Filter communities based on search query (client-side for now)
  const filteredCommunities = React.useMemo(() => {
    if (!searchQuery.trim()) return communities;

    const query = searchQuery.toLowerCase();
    return communities.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.title?.toLowerCase().includes(query)
    );
  }, [communities, searchQuery]);

  const handleSearchChange = (value: string) => {
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce search
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 300);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a community"
          className="w-full justify-between md:w-[300px]"
        >
          {value ? (
            <span className="flex items-center gap-2">
              {value.iconImage && (
                <img
                  src={value.iconImage}
                  alt=""
                  className="h-5 w-5 rounded-full object-cover"
                />
              )}
              <span>r/{value.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Choose a community</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search communities..."
            onValueChange={handleSearchChange}
            className="h-9"
          />
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading communities...
              </div>
            ) : filteredCommunities.length === 0 ? (
              <CommandEmpty>No community found.</CommandEmpty>
            ) : (
              <CommandGroup heading="Communities">
                {filteredCommunities.map((community) => (
                  <CommandItem
                    key={community._id}
                    value={community.name}
                    onSelect={() => {
                      onChange(community._id === value?._id ? null : community);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    {community.iconImage ? (
                      <img
                        src={community.iconImage}
                        alt=""
                        className="h-5 w-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                        {community.name[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">r/{community.name}</span>
                      {community.memberCount !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          {community.memberCount.toLocaleString()} members
                        </span>
                      )}
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value?._id === community._id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
