import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AUTH_ERRORS } from "./types";

// Environment variables with validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
    throw new Error(AUTH_ERRORS.MISSING_URL);
}

if (!supabaseAnonKey) {
    throw new Error(AUTH_ERRORS.MISSING_ANON_KEY);
}

// Create and export the Supabase client
export const supabase: SupabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Optional: Service role client for admin operations (uncomment if needed)
// const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// if (supabaseServiceRoleKey) {
//     export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
//         auth: { persistSession: false }
//     });
// }