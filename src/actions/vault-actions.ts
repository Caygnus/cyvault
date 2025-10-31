
import { VaultServiceImpl } from "@/service";
import { VaultFilter, VaultResponse } from "@/domain";
import { ListResponse, EntityStatus, SortOrder } from "@/types";
import { BaseAction } from "./BaseAction";

/**
 * Get all vaults with optional filtering
 */
export async function getVaults(filter?: {
    limit?: number;
    offset?: number;
    status?: EntityStatus;
    sort?: string;
    order?: SortOrder;
    nameContains?: string;
    color?: string;
}): Promise<ListResponse<VaultResponse> | null> {
    return await BaseAction.withContext(async (params) => {
        try {
            const vaultService = new VaultServiceImpl(params);
            const vaultFilter = filter ? new VaultFilter(filter) : undefined;
            return await vaultService.listVaults(vaultFilter);
        } catch (error) {
            console.error("Failed to get vaults:", error);
            return null;
        }
    });
}

/**
 * Get a single vault by ID
 */
export async function getVaultById(id: string): Promise<VaultResponse | null> {
    return await BaseAction.withContext(async (params) => {
        try {
            const vaultService = new VaultServiceImpl(params);
            return await vaultService.getVaultById(id);
        } catch (error) {
            console.error("Failed to get vault:", error);
            return null;
        }
    });
}

/**
 * Create a new vault
 */
export async function createVault(request: {
    name: string;
    description?: string | null;
    iconUrl?: string | null;
    color?: string | null;
    metadata?: Record<string, string> | null;
}): Promise<VaultResponse | null> {
    return await BaseAction.withContext(async (params) => {
        try {
            const vaultService = new VaultServiceImpl(params);
            const { VaultRequest } = await import("@/domain");
            const vaultRequest = new VaultRequest(
                request.name,
                request.description ?? null,
                request.iconUrl ?? null,
                request.color ?? null,
                request.metadata ?? null
            );
            return await vaultService.createVault(vaultRequest);
        } catch (error) {
            console.error("Failed to create vault:", error);
            return null;
        }
    });
}

/**
 * Update an existing vault
 */
export async function updateVault(
    id: string,
    request: {
        name?: string;
        description?: string | null;
        iconUrl?: string | null;
        color?: string | null;
        metadata?: Record<string, string> | null;
    }
): Promise<VaultResponse | null> {
    return await BaseAction.withContext(async (params) => {
        try {
            const vaultService = new VaultServiceImpl(params);
            const { VaultUpdateRequest } = await import("@/domain");
            const updateRequest = new VaultUpdateRequest(
                request.name,
                request.description ?? null,
                request.iconUrl ?? null,
                request.color ?? null,
                request.metadata ?? null
            );
            return await vaultService.updateVault(id, updateRequest);
        } catch (error) {
            console.error("Failed to update vault:", error);
            return null;
        }
    });
}

/**
 * Delete a vault (soft delete)
 */
export async function deleteVault(id: string): Promise<boolean> {
    return await BaseAction.withContext(async (params) => {
        try {
            const vaultService = new VaultServiceImpl(params);
            await vaultService.deleteVault(id);
            return true;
        } catch (error) {
            console.error("Failed to delete vault:", error);
            return false;
        }
    });
}
