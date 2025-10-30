import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/core/middleware";
import { ensureBootstrap, getRepoParams } from "@/core/di";
import { VaultServiceImpl } from "@/service";
import { VaultUpdateRequest } from "@/domain";
import { Err } from "@/types";

// getVaultHandler retrieves a single vault by its unique identifier
// @Summary Get a vault by ID
// @Description Retrieve a single vault by its unique identifier
// @Tags Vaults
// @Security bearerAuth
// @Produce json
// @Param id path string true "Vault unique identifier"
// @Success 200 {object} VaultResponse
// @Failure 401 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /api/v1/vaults/{id} [get]
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

// updateVaultHandler handles updating an existing vault with new details
// @Summary Update a vault
// @Description Update an existing vault with new details. All fields are optional - only provided fields will be updated.
// @Tags Vaults
// @Security bearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Vault unique identifier"
// @Param body body VaultUpdateRequest true "Updated vault details"
// @Success 200 {object} VaultResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /api/v1/vaults/{id} [put]
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

// deleteVaultHandler handles soft deletion of a vault
// @Summary Delete a vault (soft delete)
// @Description Soft deletes a vault by marking it as deleted. The vault data is preserved but no longer accessible.
// @Tags Vaults
// @Security bearerAuth
// @Produce json
// @Param id path string true "Vault unique identifier"
// @Success 200 {object} object "Deletion confirmation message"
// @Failure 401 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /api/v1/vaults/{id} [delete]
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

