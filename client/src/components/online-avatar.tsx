import { useNavigate } from "react-router-dom"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  BoltIcon,
  BookOpenIcon,
  Layers2Icon,
  LogOutIcon,
  PinIcon,
  UserIcon,
  UserPenIcon,
} from "lucide-react"
import { useAuth } from "@/context/auth-provider"
import { getImageUrl } from "@/lib/utils"

export default function OnlineAvatar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // If user data isn't available yet, don't render (or render a skeleton)
  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="relative">
      <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto p-0 hover:bg-transparent rounded-full">
      <Avatar>
        <AvatarImage src={getImageUrl(user.userPhotoUrl)} alt={user.username} className="object-cover" />
        <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <span className="absolute -end-0.5 -bottom-0.5 size-3 rounded-full border-2 border-background bg-emerald-500">
        <span className="sr-only">Online</span>
      </span>
      </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-w-64" align="end">
        <DropdownMenuLabel className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-foreground">
            {user.firstName ? `${user.firstName} ${user.lastName || ""}` : user.username}
          </span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {/* Profile Option */}
          <DropdownMenuItem onClick={() => navigate(`/user/${user.username}`)} className="cursor-pointer">
            <UserIcon size={16} className="opacity-60" aria-hidden="true" />
            <span>Profile</span>
          </DropdownMenuItem>
          {/* Other options kept as undefined/placeholders as requested */}
          <DropdownMenuItem>
            <Layers2Icon size={16} className="opacity-60" aria-hidden="true" />
            <span>Option 2</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <BookOpenIcon size={16} className="opacity-60" aria-hidden="true" />
            <span>Option 3</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <PinIcon size={16} className="opacity-60" aria-hidden="true" />
            <span>Option 4</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <UserPenIcon size={16} className="opacity-60" aria-hidden="true" />
            <span>Option 5</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOutIcon size={16} className="opacity-60" aria-hidden="true" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}