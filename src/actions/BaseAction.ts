import 'server-only';

import RequestContext, { RequestContextStore } from "@/core/context/context";
import { UserHeaders } from "@/core/middleware/middleware";
import { createClient } from "@/core/supabase/server";
import { getTenantIdFromUser } from "@/core/utils/tenant";
import { ensureBootstrap, getRepoParams, type RepoParams } from "@/core/di";

/**
 * Base class for server actions that handles RequestContext setup and bootstrap
 * 
 * IMPORTANT: Server actions don't go through Next.js middleware, so they run in a
 * separate async context. Even if middleware sets RequestContext, server actions
 * won't have access to it due to AsyncLocalStorage isolation.
 * 
 * This class ensures all server actions have proper context setup.
 */
export abstract class BaseAction {
    /**
     * Sets up RequestContext, ensures bootstrap, and executes the handler with repo params
     * Use this for static methods - it handles all setup and provides repo params to your handler
     */
    public static async withContext<T>(
        handler: (params: RepoParams) => T | Promise<T>
    ): Promise<T> {
        // Check if context already exists
        if (RequestContext.hasContext()) {
            await ensureBootstrap();
            const params = getRepoParams();
            return handler(params);
        }

        // Set up context for server action (similar to middleware logic)
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            // Still create context even without user (for unauthenticated actions)
            const contextStore: RequestContextStore = {
                requestId: crypto.randomUUID(),
                requestMethod: "SERVER_ACTION",
                requestPath: "/server-action",
                requestStartTime: Date.now(),
            } as RequestContextStore;

            return RequestContext.run(contextStore, async () => {
                await ensureBootstrap();
                const params = getRepoParams();
                return handler(params);
            });
        }

        // Get tenant ID (checks metadata first, then database)
        // Note: We need to bootstrap first for database lookup, but this should be safe
        // as getTenantIdFromUser handles bootstrap internally
        const tenantId = await getTenantIdFromUser(user);

        console.log('[BaseAction] User:', user.id, 'Email:', user.email);
        console.log('[BaseAction] Tenant ID lookup result:', tenantId);

        if (!tenantId) {
            console.warn('[BaseAction] No tenant ID found for user:', user.id);
            console.warn('[BaseAction] User metadata:', JSON.stringify(user.user_metadata || {}, null, 2));
            console.warn('[BaseAction] App metadata:', JSON.stringify(user.app_metadata || {}, null, 2));
        }

        const contextStore: Partial<RequestContextStore> = {
            requestId: crypto.randomUUID(),
            requestMethod: "SERVER_ACTION",
            requestPath: "/server-action",
            requestStartTime: Date.now(),
        };

        contextStore[UserHeaders.USER_ID] = user.id;
        contextStore[UserHeaders.USER_EMAIL] = user.email || "";

        if (tenantId) {
            contextStore[UserHeaders.TENANT_ID] = tenantId;
            console.log('[BaseAction] Setting tenant ID in context:', tenantId);
        } else {
            // Tenant ID is required for most operations - log warning but continue
            // The actual operation will fail if tenant ID is truly required
            console.warn('[BaseAction] Setting up context without tenant ID - operations may fail');
        }

        console.log('[BaseAction] Context store keys:', Object.keys(contextStore));
        console.log('[BaseAction] Tenant ID in context store:', contextStore[UserHeaders.TENANT_ID]);

        // Run handler within the context - this ensures context persists for the handler execution
        return RequestContext.run(contextStore as RequestContextStore, async () => {
            // Verify context is accessible
            const hasContext = RequestContext.hasContext();
            const contextTenantId = RequestContext.tryGetTenantId();
            console.log('[BaseAction] Inside RequestContext.run - hasContext:', hasContext);
            console.log('[BaseAction] Inside RequestContext.run - tenantId from context:', contextTenantId);

            if (!hasContext || !contextTenantId) {
                console.error('[BaseAction] Context not accessible inside handler!');
                console.error('[BaseAction] Expected tenant ID:', tenantId);
                console.error('[BaseAction] Context store that was passed:', JSON.stringify(contextStore, null, 2));
            }

            await ensureBootstrap();
            const params = getRepoParams();
            return handler(params);
        });
    }
}
