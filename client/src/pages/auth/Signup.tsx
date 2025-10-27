import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "@/lib/api";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ThemeProvider } from "@/components/theme-provider";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Logo from "@/components/logo";
import { Avatar } from "@/components/ui/avatar";

const signupShema = z.object({
    username: z.string().min(3, "Your username must be at least 3 characters long"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Your password must be at least 8 characters long"),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    bio: z.string().max(320, "Bio must be less than 320 characters").optional()
})


type SignupData = z.infer<typeof signupShema>;

export default function Signup() {
    const nav = useNavigate()
    const [serverError, setServerError] = useState<string | null>(null)

    const { register, handleSubmit, formState: { errors, isSubmitting } } =
        useForm<SignupData>({ resolver: zodResolver(signupShema) });


    async function onSubmit(values: SignupData) {
        try {
            setServerError(null);
            await api.post("/users/signup", values);
            nav("/");
        } catch (err: any) {
            setServerError(err?.response?.data?.message || "Signup failed");
        }
    }

    return (

        <ThemeProvider>
            <div className="min-h-screen relative grid grid-cols-1 md:grid-cols-2">
                {/* Theme Toggle */}
                <div className="absolute top-4 right-4 z-10">
                    <ThemeToggle />
                </div>

                {/* LEFT SIDE — Reddit logo and tagline */}
                <div className="flex flex-col items-center justify-center bg-background border-b md:border-b-0 md:border-r p-8 text-center md:text-left">
                    <img
                        src="/Reddit_Symbol_23.svg"
                        alt="Wreddit Logo"
                        className="w-32 h-32 mb-4 transition-transform hover:scale-105"
                    />
                    <h2 className="text-3xl font-bold text-primary">Welcome to Wreddit</h2>
                    <p className="text-muted-foreground mt-3 max-w-xs">
                        Dive into conversations that matter.
                        Share your thoughts and join the community today.
                    </p>
                </div>

                {/* RIGHT SIDE — Signup form */}
                <div className="flex items-center justify-center p-8">
                    <div className="w-full max-w-md space-y-6">
                        <h1 className="text-2xl font-semibold text-center">Create your account</h1>

                        {serverError && (
                            <div className="text-sm border border-destructive/50 text-destructive rounded-md p-3">
                                {serverError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                            <input
                                className="w-full border p-2 rounded bg-background"
                                placeholder="Username"
                                {...register("username")}
                            />
                            {errors.username && <p className="text-sm text-red-500">{errors.username.message}</p>}

                            <input
                                className="w-full border p-2 rounded bg-background"
                                placeholder="Email"
                                {...register("email")}
                            />
                            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}

                            <input
                                type="password"
                                className="w-full border p-2 rounded bg-background"
                                placeholder="Password"
                                {...register("password")}
                            />
                            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}

                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    className="border p-2 rounded bg-background"
                                    placeholder="First name (optional)"
                                    {...register("firstName")}
                                />
                                <input
                                    className="border p-2 rounded bg-background"
                                    placeholder="Last name (optional)"
                                    {...register("lastName")}
                                />
                            </div>

                            <textarea
                                className="w-full border p-2 rounded bg-background"
                                placeholder="Bio (optional)"
                                rows={3}
                                {...register("bio")}
                            />
                            {errors.bio && <p className="text-sm text-red-500">{errors.bio.message}</p>}

                            <Button type="submit" disabled={isSubmitting} className="w-full">
                                {isSubmitting ? "Creating..." : "Sign Up"}
                            </Button>
                        </form>

                        <p className="text-sm text-muted-foreground text-center mt-4">
                            Already have an account?{" "}
                            <Link to="/login" className="text-primary underline">
                                Log in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </ThemeProvider>
    )
}