import { useId, useState } from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import api from "@/lib/api"
import { useAuthModal } from "@/context/auth-modal-provider"
import { useAuth } from "@/context/auth-provider"

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
const PasswordInput = (props: React.ComponentProps<typeof Input>) => {
  const [isVisible, setIsVisible] = useState(false)
  const toggleVisibility = () => setIsVisible((prevState) => !prevState)
  const id = useId()
  const inputId = props.id || id

  return (
    <div className="relative">
      <Input
        id={inputId}
        className="pe-9"
        placeholder="Enter your password"
        type={isVisible ? "text" : "password"}
        required
        {...props}
      />
      <button
        className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 transition-[color,box-shadow] outline-none hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
        type="button"
        onClick={toggleVisibility}
        aria-label={isVisible ? "Hide password" : "Show password"}
        aria-pressed={isVisible}
        aria-controls={inputId}
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

// --- Login Form Schema ---
const loginSchema = z.object({
  identifierType: z.string().min(1, "Username or Email is required"),
  password: z.string().min(1, "Password is required"),
})

type LoginData = z.infer<typeof loginSchema>


// --- Login Form Component ---
const LoginForm = () => {
  const id = useId()
  const { closeModal } = useAuthModal();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginData>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(values: LoginData) {
    try {
      setServerError(null)
      const response = await api.post("/users/login", values)

      // Extract token and user from response
      const { token, data } = response.data;

      // Update global auth state
      login(token, data.user);

      closeModal();
    } catch (err: any) {
      setServerError(
        err?.response?.data?.message || "Invalid credentials."
      )
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {serverError && (
        <div className="text-sm border border-destructive/50 text-destructive rounded-md p-3 bg-destructive/10">
          {serverError}
        </div>
      )}
      <div className="space-y-4">
        <div className="*:not-first:mt-2">
          <Label htmlFor={`${id}-login-credential`}>Username or Email</Label>
          <Input
            id={`${id}-login-credential`}
            placeholder="wredditer123 or email"
            type="text"
            autoComplete="username"
            {...register("identifierType")}
          />
          {errors.identifierType && (
            <p className="text-sm text-destructive mt-1">{errors.identifierType.message}</p>
          )}
        </div>
        <div className="*:not-first:mt-2">
          <Label htmlFor={`${id}-login-password`}>Password</Label>
          <PasswordInput
            id={`${id}-login-password`}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
          )}
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Logging In..." : "Log In"}
      </Button>
    </form>
  )
}

// --- Sign Up Form Schema and Type ---
const signupSchema = z.object({
  username: z.string().min(3, "Your username must be at least 3 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Your password must be at least 8 characters long"),
})

type SignupData = z.infer<typeof signupSchema>

// --- Sign Up Form Component ---
const SignUpForm = () => {
  const navigate = useNavigate()
  const { closeModal } = useAuthModal();
  const { login } = useAuth(); // Import login function
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupData>({ resolver: zodResolver(signupSchema) })

  async function onSubmit(values: SignupData) {
    try {
      setServerError(null)
      const response = await api.post("/users/signup", values)

      // Auto-Login After First Signup
      const { token, data } = response.data;

      if (token && data?.user) {
         login(token, data.user);
      }

      closeModal();
      navigate("/") // Navigate to home on success
    } catch (err: any) {
      setServerError(
        err?.response?.data?.message || "An unknown error occurred during signup."
      )
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div className="text-sm border border-destructive/50 text-destructive rounded-md p-3 bg-destructive/10">
          {serverError}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          placeholder="example@email.com"
          type="email"
          autoComplete="email"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          placeholder="wredditer123"
          type="text"
          autoComplete="username"
          {...register("username")}
        />
        {errors.username && (
          <p className="text-sm text-destructive mt-1">
            {errors.username.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput id="password" {...register("password")} />
        {errors.password && (
          <p className="text-sm text-destructive mt-1">
            {errors.password.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating Account..." : "Sign Up"}
      </Button>
    </form>
  )
}


// --- Main Auth Modal Component ---
export default function AuthModal() {
  const { isOpen, closeModal, mode, setMode } = useAuthModal();

  const onOpenChange = (open: boolean) => {
    if (!open) {
      closeModal();
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="flex flex-col items-center gap-4 pt-4">
          <img
            src="/Reddit_Symbol_23.svg"
            alt="Wreddit Logo"
            className="h-10 w-10"
          />
          <DialogHeader>
            <DialogTitle className="text-center">
              {mode === "signup"
                ? "Sign up for Wreddit"
                : "Log in to Wreddit"}
            </DialogTitle>
            <DialogDescription className="text-center">
              {mode === "signup"
                ? "We just need a few details to get you started."
                : "Welcome back! Enter your details to continue."}
            </DialogDescription>
          </DialogHeader>
        </div>

        {mode === "signup" ? <SignUpForm /> : <LoginForm />}

        {mode === "signup" && (
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
          {mode === "signup"
            ? "Already a Wredditor?"
            : "New to Wreddit?"}{" "}
          <button
            type="button"
            onClick={() =>
              setMode(mode === "signup" ? "login" : "signup")
            }
            className="underline underline-offset-4 hover:text-primary"
          >
            {mode === "signup" ? "Log In" : "Sign Up"}
          </button>
        </p>
      </DialogContent>
    </Dialog>
  )
}