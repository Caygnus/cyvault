"use client"

import * as React from "react"
import { ChevronLeft, Github, Twitter } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { supabase } from "@/core/supabase/client"
import { useState } from "react"

const SignupPage: React.FC = () => {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            setLoading(false)
            return
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long")
            setLoading(false)
            return
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/dashboard`,
                },
            })

            if (error) {
                setError(error.message)
            } else if (data.user) {
                if (data.user.email_confirmed_at) {
                    // User is already confirmed, redirect to dashboard
                    router.push("/dashboard")
                } else {
                    // User needs to confirm email
                    setError("Please check your email for a confirmation link")
                }
            }
        } catch (err) {
            setError("An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    const handleSocialLogin = async (provider: "github" | "twitter") => {
        setLoading(true)
        setError("")

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/dashboard`,
                },
            })

            if (error) {
                setError(error.message)
            }
        } catch (err) {
            setError("An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white dark:bg-zinc-950 py-20 text-zinc-800 dark:text-zinc-200 selection:bg-zinc-300 dark:selection:bg-zinc-600">
            <BackButton />
            <motion.div
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.25, ease: "easeInOut" }}
                className="relative z-10 mx-auto w-full max-w-xl p-4"
            >
                <Logo />
                <Header />
                <SocialButtons onSocialLogin={handleSocialLogin} loading={loading} />
                <Divider />
                <SignupForm
                    email={email}
                    password={password}
                    confirmPassword={confirmPassword}
                    setEmail={setEmail}
                    setPassword={setPassword}
                    setConfirmPassword={setConfirmPassword}
                    onSubmit={handleSignup}
                    loading={loading}
                    error={error}
                />
                <TermsAndConditions />
            </motion.div>
            <BackgroundDecoration />
        </div>
    )
}

const BackButton: React.FC = () => {
    const router = useRouter()

    return (
        <SocialButton
            icon={<ChevronLeft size={16} />}
            onClick={() => router.back()}
        >
            Go back
        </SocialButton>
    )
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string
}

const Button: React.FC<ButtonProps> = ({ children, className, ...props }) => (
    <button
        className={`rounded-md bg-linear-to-br from-blue-400 to-blue-700 px-4 py-2 text-lg text-zinc-50 
    ring-2 ring-blue-500/50 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 
    transition-all hover:scale-[1.02] hover:ring-transparent active:scale-[0.98] active:ring-blue-500/70 
    disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
    >
        {children}
    </button>
)

const Logo: React.FC = () => (
    <div className="mb-6 flex justify-center">
        <img
            src="https://svgl.app/library/tailwindcss.svg"
            alt="Logoipsum"
            className="h-8 w-8"
        />
        <span className="ml-2 text-xl font-bold">CyVault</span>
    </div>
)

const Header: React.FC = () => (
    <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
                Sign in.
            </a>
        </p>
    </div>
)

const SocialButtons: React.FC<{
    onSocialLogin: (provider: "github" | "twitter") => void
    loading: boolean
}> = ({ onSocialLogin, loading }) => (
    <div className="mb-6 space-y-3">
        <div className="grid grid-cols-2 gap-3">
            <SocialButton
                icon={<Twitter size={20} />}
                onClick={() => onSocialLogin("twitter")}
                disabled={loading}
            />
            <SocialButton
                icon={<Github size={20} />}
                onClick={() => onSocialLogin("github")}
                disabled={loading}
            />
            <SocialButton fullWidth disabled>
                Sign up with SSO
            </SocialButton>
        </div>
    </div>
)

const SocialButton: React.FC<{
    icon?: React.ReactNode
    fullWidth?: boolean
    children?: React.ReactNode
    onClick?: () => void
    disabled?: boolean
}> = ({ icon, fullWidth, children, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`relative z-0 flex items-center justify-center gap-2 overflow-hidden rounded-md 
    border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 
    px-4 py-2 font-semibold text-zinc-800 dark:text-zinc-200 transition-all duration-500
    before:absolute before:inset-0 before:-z-10 before:translate-x-[150%] before:translate-y-[150%] before:scale-[2.5]
    before:rounded-[100%] before:bg-zinc-800 dark:before:bg-zinc-200 before:transition-transform before:duration-1000 before:content-[""]
    hover:scale-105 hover:text-zinc-100 dark:hover:text-zinc-900 hover:before:translate-x-[0%] hover:before:translate-y-[0%] active:scale-95
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
    ${fullWidth ? "col-span-2" : ""}`}
    >
        {icon}
        <span>{children}</span>
    </button>
)

const Divider: React.FC = () => (
    <div className="my-6 flex items-center gap-3">
        <div className="h-px w-full bg-zinc-300 dark:bg-zinc-700" />
        <span className="text-zinc-500 dark:text-zinc-400">OR</span>
        <div className="h-px w-full bg-zinc-300 dark:bg-zinc-700" />
    </div>
)

const SignupForm: React.FC<{
    email: string
    password: string
    confirmPassword: string
    setEmail: (email: string) => void
    setPassword: (password: string) => void
    setConfirmPassword: (password: string) => void
    onSubmit: (e: React.FormEvent) => void
    loading: boolean
    error: string
}> = ({ email, password, confirmPassword, setEmail, setPassword, setConfirmPassword, onSubmit, loading, error }) => {
    return (
        <form onSubmit={onSubmit}>
            {error && (
                <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            <div className="mb-3">
                <label
                    htmlFor="email-input"
                    className="mb-1.5 block text-zinc-500 dark:text-zinc-400"
                >
                    Email
                </label>
                <input
                    id="email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@provider.com"
                    required
                    className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 
          bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-800 dark:text-zinc-200
          placeholder-zinc-400 dark:placeholder-zinc-500 
          ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-blue-700"
                />
            </div>
            <div className="mb-3">
                <label
                    htmlFor="password-input"
                    className="mb-1.5 block text-zinc-500 dark:text-zinc-400"
                >
                    Password
                </label>
                <input
                    id="password-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    minLength={6}
                    className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 
          bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-800 dark:text-zinc-200
          placeholder-zinc-400 dark:placeholder-zinc-500 
          ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-blue-700"
                />
            </div>
            <div className="mb-6">
                <label
                    htmlFor="confirm-password-input"
                    className="mb-1.5 block text-zinc-500 dark:text-zinc-400"
                >
                    Confirm Password
                </label>
                <input
                    id="confirm-password-input"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    minLength={6}
                    className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 
          bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-800 dark:text-zinc-200
          placeholder-zinc-400 dark:placeholder-zinc-500 
          ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-blue-700"
                />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
            </Button>
        </form>
    )
}

const TermsAndConditions: React.FC = () => (
    <p className="mt-9 text-xs text-zinc-500 dark:text-zinc-400">
        By creating an account, you agree to our{" "}
        <a href="#" className="text-blue-600 dark:text-blue-400">
            Terms & Conditions
        </a>{" "}
        and{" "}
        <a href="#" className="text-blue-600 dark:text-blue-400">
            Privacy Policy.
        </a>
    </p>
)

const BackgroundDecoration: React.FC = () => {
    return (
        <div
            className="absolute right-0 top-0 z-0 size-[50vw]"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke-width='2' stroke='rgb(30 58 138 / 0.5)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e")`,
            }}
        >
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: "radial-gradient(100% 100% at 100% 0%, rgba(255,255,255,0), rgba(255,255,255,1))",
                }}
            />
        </div>
    )
}

export default SignupPage
