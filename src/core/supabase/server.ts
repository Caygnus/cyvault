import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { User, Session, AuthResult, SessionResult } from './types'
import { AUTH_ERRORS } from './types'

// Environment variables with validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
    throw new Error(AUTH_ERRORS.MISSING_URL);
}

if (!supabaseAnonKey) {
    throw new Error(AUTH_ERRORS.MISSING_ANON_KEY);
}

/**
 * Create a Supabase client for server-side operations
 * This should be used in Server Components, API routes, and other server-side code
 */
export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(supabaseUrl!, supabaseAnonKey!, {
        cookies: {
            getAll() {
                return cookieStore.getAll()
            },
            setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    )
                } catch (error) {
                    // The `setAll` method was called from a Server Component.
                    // This can be ignored if you have middleware refreshing user sessions.
                    console.warn('Failed to set cookies in server component:', error);
                }
            },
        },
    })
}

/**
 * Get the current authenticated user
 * This is the recommended method as it validates the user with Supabase Auth server
 */
export async function getCurrentUser(): Promise<User | null> {
    try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
            console.error('Error getting current user:', error);
            return null;
        }

        return user;
    } catch (error) {
        console.error('Error in getCurrentUser:', error);
        return null;
    }
}

/**
 * Get the current session
 * Note: This is less secure than getCurrentUser() as it doesn't validate with the server
 * Use getCurrentUser() instead when possible
 */
export async function getCurrentSession(): Promise<Session | null> {
    try {
        const supabase = await createClient()
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
            console.error('Error getting current session:', error);
            return null;
        }

        return session;
    } catch (error) {
        console.error('Error in getCurrentSession:', error);
        return null;
    }
}

/**
 * Check if user is authenticated
 * Convenience function that returns a boolean
 */
export async function isAuthenticated(): Promise<boolean> {
    const user = await getCurrentUser();
    return user !== null;
}

/**
 * Get user with error handling
 * Returns both user and any error that occurred
 */
export async function getUserWithError(): Promise<AuthResult> {
    try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
            return { user: null, error: new Error(error.message) };
        }

        return { user, error: null };
    } catch (error) {
        return {
            user: null,
            error: error instanceof Error ? error : new Error('Unknown error occurred')
        };
    }
}

/**
 * Get session with error handling
 * Returns both session and any error that occurred
 */
export async function getSessionWithError(): Promise<SessionResult> {
    try {
        const supabase = await createClient()
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
            return { session: null, error: new Error(error.message) };
        }

        return { session, error: null };
    } catch (error) {
        return {
            session: null,
            error: error instanceof Error ? error : new Error('Unknown error occurred')
        };
    }
}