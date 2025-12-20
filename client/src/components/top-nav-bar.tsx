import { MessageSquare, PlusIcon } from "lucide-react"
import { Link } from "react-router-dom"; // Add this import

import ThemeToggle from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"

import { useAuthModal } from "@/context/auth-modal-provider"
import { useAuth } from "@/context/auth-provider"
import Notifications from "@/components/notifications"
import OnlineAvatar from "@/components/online-avatar"
import SearchBar from "@/components/searchBar";


export default function NavBar() {
  const { openModal } = useAuthModal();
  const { isAuthenticated } = useAuth();

  return (
    <header className="border-b px-4 md:px-6">
      <div className="flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex-1">
          <Link to="/" className="text-primary hover:text-primary/90 flex items-center">
            <img
              src="/Reddit_Symbol_23.svg"
              alt="Logo"
              className="h-10 w-auto"
            />
          </Link>
        </div>

        {/* Middle area */}
        <div className="grow max-sm:hidden">
          <SearchBar />
        </div>

        {/* Right side */}
        <div className="flex flex-1 items-center justify-end gap-2">
          {isAuthenticated ? (
            // Logged In: Show Create Community, Notifications, and Avatar
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" asChild>
                <Link to="/chat" aria-label="Messages">
                  <MessageSquare className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" asChild>
                <Link to="/submit" aria-label="Create post">
                  <PlusIcon className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/create-community">Create Community</Link>
              </Button>
              <Notifications />
              <OnlineAvatar />
            </div>
          ) : (
            // Logged Out: Show Login button
            <Button size="sm" className="text-sm" onClick={() => openModal('login')}>
              Log In
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}