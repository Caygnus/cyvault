/**
 * Application Routes Configuration
 * Centralized route definitions for the application
 */
export const routes = {
    // Main navigation routes
    home: "/",
    dashboard: "/",
    vaults: "/vaults",
    items: "/items",
    shared: "/shared",
    favorites: "/favorites",
    trash: "/trash",

    // Settings and account
    settings: "/settings",
    profile: "/profile",
    logout: "/logout",

    // Auth routes
    login: "/login",
    signup: "/signup",
    signupConfirmation: "/signup/confirmation",

    // API routes
    api: {
        health: "/api/health",
        auth: {
            signup: "/api/auth/signup",
        },
        users: {
            me: "/api/users/me",
        },
    },
} as const

/**
 * Type-safe route helper
 */
export type Route = typeof routes

