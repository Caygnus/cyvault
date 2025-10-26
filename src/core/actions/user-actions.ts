"use server";

import RequestContext, { RequestContextStore } from "@/core/context/context";
import { getRepoParams } from "@/core/di";
import { UserServiceImpl } from "@/service";
import { UserHeaders } from "@/core/middleware/middleware";
import { createClient } from "@/core/supabase/server";

export async function getCurrentUser() {
    return await withContext(async () => {
        try {
            const params = getRepoParams();
            const userService = new UserServiceImpl(params);
            return await userService.getCurrentUser();
        } catch (error) {
            console.error("Failed to get current user:", error);
            return null;
        }
    });
}

export async function isAuthenticated() {
    return await withContext(() => RequestContext.hasUser());
}

export async function getCurrentUserId() {
    return await withContext(() => RequestContext.tryGetUserId());
}

export async function getCurrentUserEmail() {
    return await withContext(() => RequestContext.tryGetUserEmail());
}

export async function getCurrentTenantId() {
    return await withContext(() => RequestContext.tryGetTenantId());
}

export async function getUserContextData() {
    return await withContext(() => ({
        userId: RequestContext.tryGetUserId(),
        userEmail: RequestContext.tryGetUserEmail(),
        tenantId: RequestContext.tryGetTenantId(),
        isAuthenticated: RequestContext.hasUser(),
        hasTenant: RequestContext.hasTenant(),
    }));
}

async function withContext<T>(fn: () => T | Promise<T>): Promise<T> {
    if (RequestContext.hasContext()) {
        return fn();
    }

    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    const contextStore: Partial<RequestContextStore> = {
        requestId: crypto.randomUUID(),
        requestMethod: "SERVER_ACTION",
        requestPath: "/server-action",
        requestStartTime: Date.now(),
    };

    if (session?.user) {
        contextStore[UserHeaders.USER_ID] = session.user.id;
        contextStore[UserHeaders.USER_EMAIL] = session.user.email;

        const tenantId = session.user.user_metadata?.tenant_id ||
            session.user.app_metadata?.tenant_id;

        if (tenantId) {
            contextStore[UserHeaders.TENANT_ID] = tenantId;
        }
    }

    return RequestContext.run(contextStore as unknown as RequestContextStore, fn);
}