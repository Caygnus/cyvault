"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { supabase } from "@/core/supabase/client"

const LandingPage: React.FC = () => {
  const router = useRouter()

  useEffect(() => {
    // Check if user is already authenticated
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.push("/dashboard")
      }
    }
    checkUser()
  }, [router])

  const handleGetStarted = () => {
    router.push("/signup")
  }

  const handleSignIn = () => {
    router.push("/login")
  }

  return (
    <div className="bg-white dark:bg-zinc-950 min-h-screen text-zinc-800 dark:text-zinc-200 selection:bg-zinc-300 dark:selection:bg-zinc-600">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.25, ease: "easeInOut" }}
        className="relative z-10 mx-auto w-full max-w-6xl p-4"
      >
        <Header />
        <Hero />
        <Features />
        <CTA onGetStarted={handleGetStarted} onSignIn={handleSignIn} />
      </motion.div>
      <BackgroundDecoration />
    </div>
  )
}

const Header: React.FC = () => {
  const router = useRouter()

  return (
    <header className="flex items-center justify-between py-6">
      <div className="flex items-center">
        <img
          src="https://svgl.app/library/tailwindcss.svg"
          alt="CyVault"
          className="h-8 w-8"
        />
        <span className="ml-2 text-xl font-bold">CyVault</span>
      </div>
      <div className="flex gap-4">
        <button
          onClick={() => router.push("/login")}
          className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
        >
          Sign In
        </button>
        <button
          onClick={() => router.push("/signup")}
          className="px-4 py-2 bg-linear-to-br from-blue-400 to-blue-700 text-white rounded-md hover:from-blue-500 hover:to-blue-800 transition-all"
        >
          Get Started
        </button>
      </div>
    </header>
  )
}

const Hero: React.FC = () => (
  <section className="text-center py-20">
    <h1 className="text-5xl font-bold mb-6 bg-linear-to-br from-blue-400 to-blue-700 bg-clip-text text-transparent">
      Secure Your Digital Life
    </h1>
    <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-8 max-w-2xl mx-auto">
      CyVault is your all-in-one solution for password management, secure storage, and digital asset protection.
    </p>
    <div className="flex gap-4 justify-center">
      <button className="px-8 py-3 bg-linear-to-br from-blue-400 to-blue-700 text-white rounded-md text-lg font-semibold hover:from-blue-500 hover:to-blue-800 transition-all">
        Start Free Trial
      </button>
      <button className="px-8 py-3 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-md text-lg font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
        Learn More
      </button>
    </div>
  </section>
)

const Features: React.FC = () => (
  <section className="py-20">
    <h2 className="text-3xl font-bold text-center mb-12">Why Choose CyVault?</h2>
    <div className="grid md:grid-cols-3 gap-8">
      <FeatureCard
        title="Military-Grade Encryption"
        description="Your data is protected with AES-256 encryption, the same standard used by banks and governments."
        icon="🔒"
      />
      <FeatureCard
        title="Cross-Platform Sync"
        description="Access your vault from any device, anywhere. Your data syncs seamlessly across all platforms."
        icon="📱"
      />
      <FeatureCard
        title="Zero-Knowledge Architecture"
        description="We can't see your data. Only you have the keys to decrypt and access your information."
        icon="🛡️"
      />
    </div>
  </section>
)

const FeatureCard: React.FC<{
  title: string
  description: string
  icon: string
}> = ({ title, description, icon }) => (
  <div className="text-center p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-zinc-600 dark:text-zinc-400">{description}</p>
  </div>
)

const CTA: React.FC<{
  onGetStarted: () => void
  onSignIn: () => void
}> = ({ onGetStarted, onSignIn }) => (
  <section className="text-center py-20">
    <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
    <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-8">
      Join thousands of users who trust CyVault with their digital security.
    </p>
    <div className="flex gap-4 justify-center">
      <button
        onClick={onGetStarted}
        className="px-8 py-3 bg-linear-to-br from-blue-400 to-blue-700 text-white rounded-md text-lg font-semibold hover:from-blue-500 hover:to-blue-800 transition-all"
      >
        Create Account
      </button>
      <button
        onClick={onSignIn}
        className="px-8 py-3 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-md text-lg font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
      >
        Sign In
      </button>
    </div>
  </section>
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

export default LandingPage