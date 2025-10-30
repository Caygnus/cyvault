import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/core/middleware";
import { ensureBootstrap, getRepoParams } from "@/core/di";
import { VaultServiceImpl } from "@/service";
import { VaultUpdateRequest } from "@/domain";
import { Err } from "@/types";

/**
 * GET /api/vaults/[id] - Get a vault by ID
 */
async function getVaultHandler(
    request: NextRequest,
    context?: { params: unknown }
) {
    await ensureBootstrap();
    const params = context?.params as Promise<{ id: string }> | undefined;
    if (!params) {
        throw Err.validation("Missing route parameters").build();
    }
    const { id } = await params;
    const repoParams = getRepoParams();
    const vaultService = new VaultServiceImpl(repoParams);

    const vault = await vaultService.getVaultById(id);

    if (!vault) {
        throw Err.notFound("Vault", id).build();
    }

    return NextResponse.json(vault.toJson());
}

/**
 * PUT /api/vaults/[id] - Update a vault
 */
async function updateVaultHandler(
    request: NextRequest,
    context?: { params: unknown }
) {
    await ensureBootstrap();
    const params = context?.params as Promise<{ id: string }> | undefined;
    if (!params) {
        throw Err.validation("Missing route parameters").build();
    }
    const { id } = await params;
    const repoParams = getRepoParams();
    const vaultService = new VaultServiceImpl(repoParams);

    const body = await request.json();
    const updateRequest = new VaultUpdateRequest(
        body.name,
        body.description ?? null,
        body.iconUrl ?? null,
        body.color ?? null,
        body.metadata ?? null
    );

    const result = await vaultService.updateVault(id, updateRequest);

    return NextResponse.json(result.toJson());
}

/**
 * DELETE /api/vaults/[id] - Delete a vault (soft delete)
 */
async function deleteVaultHandler(
    request: NextRequest,
    context?: { params: unknown }
) {
    await ensureBootstrap();
    const params = context?.params as Promise<{ id: string }> | undefined;
    if (!params) {
        throw Err.validation("Missing route parameters").build();
    }
    const { id } = await params;
    const repoParams = getRepoParams();
    const vaultService = new VaultServiceImpl(repoParams);

    await vaultService.deleteVault(id);

    return NextResponse.json({ message: "Vault deleted successfully" }, { status: 200 });
}

export const GET = withApiHandler(getVaultHandler);
export const PUT = withApiHandler(updateVaultHandler);
export const DELETE = withApiHandler(deleteVaultHandler);

