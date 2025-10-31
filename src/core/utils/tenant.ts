import { User } from '@supabase/supabase-js';
import { getRepoParams, ensureBootstrap } from '@/core/di';

/**
 * Extract tenant ID from user metadata (Supabase)
 */
export function extractTenantIdFromMetadata(user: User | null): string | null {
    if (!user) return null;
    const userMetadata = user.user_metadata || {};
    const appMetadata = user.app_metadata || {};
    return userMetadata.tenant_id || appMetadata.tenant_id || null;
}

/**
 * Get tenant ID from user - checks metadata first, then falls back to database
 * This ensures tenant ID is always available even if not in Supabase metadata
 */
export async function getTenantIdFromUser(user: User): Promise<string | null> {
    // Try metadata first (fastest)
    const tenantIdFromMetadata = extractTenantIdFromMetadata(user);
    if (tenantIdFromMetadata) {
        console.log('[TenantLookup] Found tenant ID in metadata:', tenantIdFromMetadata);
        return tenantIdFromMetadata;
    }

    console.log('[TenantLookup] Tenant ID not in metadata, checking database for user:', user.id);

    // Fallback to database lookup
    try {
        await ensureBootstrap();
        const params = getRepoParams();
        const { data: userData, error: userError } = await params.userRepository.findById(user.id);

        if (userError) {
            console.error('[TenantLookup] Error fetching user from database:', userError);
            return null;
        }

        if (userData && userData.tenantId) {
            console.log('[TenantLookup] Found tenant ID in database:', userData.tenantId);
            return userData.tenantId;
        }

        console.warn('[TenantLookup] User found in database but no tenantId:', user.id);
    } catch (error) {
        console.error('[TenantLookup] Failed to fetch tenant ID from database:', error);
        // Don't throw - return null and let caller handle it
    }

    console.warn('[TenantLookup] No tenant ID found for user:', user.id);
    return null;
}

