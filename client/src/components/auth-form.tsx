import { useId, useState } from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// --- New Reusable Password Input Component (based on your code) ---
const PasswordInput = ({ id }: { id: string }) => {
  const [isVisible, setIsVisible] = useState(false)
  const toggleVisibility = () => setIsVisible((prevState) => !prevState)

  return (
    <div className="relative">
      <Input
        id={id}
        className="pe-9"
        placeholder="Enter your password"
        type={isVisible ? "text" : "password"}
        required
      />
      <button
        className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 transition-[color,box-shadow] outline-none hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
        type="button"
        onClick={toggleVisibility}
        aria-label={isVisible ? "Hide password" : "Show password"}
        aria-pressed={isVisible}
        aria-controls={id}
      >
        {isVisible ? (
          <EyeOffIcon size={16} aria-hidden="true" />
        ) : (
          <EyeIcon size={16} aria-hidden="true" />
        )}
      </button>
    </div>
  )
}

// --- Login Form Component ---
const LoginForm = () => {
  const id = useId()
  return (
    <form className="space-y-5">
      <div className="space-y-4">
        <div className="*:not-first:mt-2">
          <Label htmlFor={`${id}-login-credential`}>Username or Email</Label>
          <Input
            id={`${id}-login-credential`}
            placeholder="wredditer123 or email"
            type="text"
            autoComplete="username"
            required
          />
        </div>
        <div className="*:not-first:mt-2">
          <Label htmlFor={`${id}-login-password`}>Password</Label>
          <PasswordInput id={`${id}-login-password`} />
        </div>
      </div>
      <Button type="submit" className="w-full">
        Log In
      </Button>
    </form>
  )
}

// --- Sign Up Form Component ---
const SignUpForm = () => {
  const id = useId()
  return (
    <form className="space-y-5">
      <div className="space-y-4">
        <div className="*:not-first:mt-2">
          <Label htmlFor={`${id}-email`}>Email</Label>
          <Input
            id={`${id}-email`}
            placeholder="example@email.com"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <div className="*:not-first:mt-2">
          <Label htmlFor={`${id}-username`}>Username</Label>
          <Input
            id={`${id}-username`}
            placeholder="wredditer123"
            type="text"
            autoComplete="username"
            required
          />
        </div>
        <div className="*:not-first:mt-2">
          <Label htmlFor={`${id}-password`}>Password</Label>
          <PasswordInput id={`${id}-password`} />
        </div>
      </div>
      <Button type="submit" className="w-full">
        Sign Up
      </Button>
    </form>
  )
}

// --- Main Auth Component ---
export default function AuthComponent() {
  const [isOpen, setIsOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"signup" | "login">("login")

  const openModal = () => {
    setAuthMode("login") // Always open in login mode
    setIsOpen(true)
  }

  return (
    <>
      <Button variant="outline" onClick={openModal}>
        Log In
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <div className="flex flex-col items-center gap-4 pt-4">
            <img
              src="/Reddit_Symbol_23.svg"
              alt="Wreddit Logo"
              className="h-10 w-10"
            />
            <DialogHeader>
              <DialogTitle className="text-center">
                {authMode === "signup"
                  ? "Sign up for Wreddit"
                  : "Log in to Wreddit"}
              </DialogTitle>
              <DialogDescription className="text-center">
                {authMode === "signup"
                  ? "We just need a few details to get you started."
                  : "Welcome back! Enter your details to continue."}
              </DialogDescription>
            </DialogHeader>
          </div>

          {authMode === "signup" ? <SignUpForm /> : <LoginForm />}

          {authMode === "signup" && (
            <p className="px-8 text-center text-xs text-muted-foreground">
              By signing up, you agree to our{" "}
              <a
                className="underline underline-offset-4 hover:text-primary"
                href="#"
              >
                Terms of Service
              </a>
              .
            </p>
          )}

          <p className="px-8 text-center text-xs text-muted-foreground">
            {authMode === "signup"
              ? "Already a Wredditor?"
              : "New to Wreddit?"}{" "}
            <button
              type="button"
              onClick={() =>
                setAuthMode(authMode === "signup" ? "login" : "signup")
              }
              className="underline underline-offset-4 hover:text-primary"
            >
              {authMode === "signup" ? "Log In" : "Sign Up"}
            </button>
          </p>
        </DialogContent>
      </Dialog>
    </>
  )
}