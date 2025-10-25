"use client"

import * as React from "react"
import { ChevronLeft, Github, Twitter } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/core/supabase/client"
import { useEffect, useState } from "react"

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectTo = searchParams.get('redirect') || '/'

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                router.replace(redirectTo)
            }
        }
        checkUser()
    }, [redirectTo, router])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                setError(error.message)
            } else if (data.user) {
                router.push(redirectTo)
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
        <div>
            <BackButton />
            <motion.div
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.25, ease: "easeInOut" }}
                className="relative z-10 mx-auto w-full max-w-xl p-4"
            >
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 p-8">
                    <Logo />
                    <Header />
                    <SocialButtons onSocialLogin={handleSocialLogin} loading={loading} />
                    <Divider />
                    <LoginForm
                        email={email}
                        password={password}
                        setEmail={setEmail}
                        setPassword={setPassword}
                        onSubmit={handleLogin}
                        loading={loading}
                        error={error}
                    />
                    <TermsAndConditions />
                </div>
            </motion.div>
        </div >
    )
}

const BackButton: React.FC = () => {
    const router = useRouter()

    return (
        <button
            onClick={() => router.back()}
            className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors bg-white/20 backdrop-blur-sm rounded-lg border border-white/30"
        >
            <ChevronLeft size={16} />
            <span className="text-sm font-medium">Back</span>
        </button>
    )
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string
}

const Button: React.FC<ButtonProps> = ({ children, className, ...props }) => (
    <button
        className={`w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-white font-semibold 
    shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 
    transform hover:scale-[1.02] active:scale-[0.98] 
    transition-all duration-200 ease-out
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
    focus:outline-none focus:ring-4 focus:ring-blue-500/30 ${className}`}
        {...props}
    >
        {children}
    </button>
)

const Logo: React.FC = () => (
    <div className="mb-8 flex justify-center">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                CyVault
            </span>
        </div>
    </div>
)

const Header: React.FC = () => (
    <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Welcome back
        </h1>
        <p className="text-slate-600 text-lg">
            Sign in to your account
        </p>
        <p className="mt-4 text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <a href="/signup" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                Create one
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
                icon={<Twitter size={18} />}
                onClick={() => onSocialLogin("twitter")}
                disabled={loading}
                label="Twitter"
            />
            <SocialButton
                icon={<Github size={18} />}
                onClick={() => onSocialLogin("github")}
                disabled={loading}
                label="GitHub"
            />
        </div>
        <SocialButton fullWidth disabled>
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Sign in with SSO
        </SocialButton>
    </div>
)

const SocialButton: React.FC<{
    icon?: React.ReactNode
    fullWidth?: boolean
    children?: React.ReactNode
    onClick?: () => void
    disabled?: boolean
    label?: string
}> = ({ icon, fullWidth, children, onClick, disabled, label }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`relative flex items-center justify-center gap-2 rounded-xl 
    border border-slate-200 bg-white hover:bg-slate-50 
    px-4 py-3 font-medium text-slate-700 transition-all duration-200
    hover:shadow-md hover:border-slate-300 active:scale-95
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none
    ${fullWidth ? "w-full" : ""}`}
    >
        {icon}
        <span>{children || label}</span>
    </button>
)

const Divider: React.FC = () => (
    <div className="my-6 flex items-center gap-3">
        <div className="h-px w-full bg-slate-300" />
        <span className="text-slate-500 text-sm font-medium">OR</span>
        <div className="h-px w-full bg-slate-300" />
    </div>
)

const LoginForm: React.FC<{
    email: string
    password: string
    setEmail: (email: string) => void
    setPassword: (password: string) => void
    onSubmit: (e: React.FormEvent) => void
    loading: boolean
    error: string
}> = ({ email, password, setEmail, setPassword, onSubmit, loading, error }) => {
    return (
        <form onSubmit={onSubmit} className="space-y-4">
            {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
            )}

            <div>
                <label
                    htmlFor="email-input"
                    className="block text-sm font-medium text-slate-700 mb-2"
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
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900
          placeholder-slate-400 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-all duration-200"
                />
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <label
                        htmlFor="password-input"
                        className="block text-sm font-medium text-slate-700"
                    >
                        Password
                    </label>
                    <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        Forgot?
                    </a>
                </div>
                <input
                    id="password-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900
          placeholder-slate-400 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-all duration-200"
                />
            </div>

            <Button type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
            </Button>
        </form>
    )
}

const TermsAndConditions: React.FC = () => (
    <p className="mt-8 text-xs text-slate-500 text-center">
        By signing in, you agree to our{" "}
        <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
            Terms & Conditions
        </a>{" "}
        and{" "}
        <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
            Privacy Policy
        </a>
    </p>
)

export default LoginPage