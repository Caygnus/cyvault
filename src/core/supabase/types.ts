import type { User, Session } from '@supabase/supabase-js';

/**
 * Common types used across Supabase client and server
 */

export type { User, Session };

/**
 * Authentication result with error handling
 */
export interface AuthResult {
    user: User | null;
    error: Error | null;
}

/**
 * Session result with error handling
 */
export interface SessionResult {
    session: Session | null;
    error: Error | null;
}

/**
 * User context for middleware
 */
export interface UserContext {
    userId: string;
    email: string;
    tenantId?: string;
}

/**
 * Environment variables validation
 */
export interface SupabaseConfig {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
}

/**
 * Common error messages
 */
export const AUTH_ERRORS = {
    MISSING_URL: 'Missing NEXT_PUBLIC_SUPABASE_URL environment variable',
    MISSING_ANON_KEY: 'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable',
    MISSING_SERVICE_KEY: 'Missing SUPABASE_SERVICE_ROLE_KEY environment variable',
    USER_NOT_FOUND: 'User not found',
    SESSION_EXPIRED: 'Session has expired',
    UNAUTHORIZED: 'Unauthorized access',
} as const;
