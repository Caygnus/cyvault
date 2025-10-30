import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/core/middleware";
import { ensureBootstrap, getRepoParams } from "@/core/di";
import { VaultServiceImpl } from "@/service";
import { VaultFilter, VaultRequest } from "@/domain";
import { EntityStatus, SortOrder } from "@/types";

/**
 * Helper function to parse query parameters into VaultFilter
 */
function parseVaultFilterFromQuery(request: NextRequest): VaultFilter {
    const { searchParams } = new URL(request.url);

    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");
    const status = searchParams.get("status");
    const sort = searchParams.get("sort");
    const order = searchParams.get("order");
    const vaultIds = searchParams.get("vaultIds");
    const nameContains = searchParams.get("nameContains");
    const descriptionContains = searchParams.get("descriptionContains");
    const color = searchParams.get("color");
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");

    return new VaultFilter({
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
        status: status ? (status as EntityStatus) : undefined,
        sort: sort || undefined,
        order: order === "asc" ? SortOrder.ASC : order === "desc" ? SortOrder.DESC : undefined,
        vaultIds: vaultIds ? vaultIds.split(",") : undefined,
        nameContains: nameContains || undefined,
        descriptionContains: descriptionContains || undefined,
        color: color || undefined,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
    });
}

/**
 * GET /api/vaults - List vaults with optional filtering and pagination
 */
async function listVaultsHandler(request: NextRequest) {
    await ensureBootstrap();
    const params = getRepoParams();
    const vaultService = new VaultServiceImpl(params);

    const filter = parseVaultFilterFromQuery(request);
    const result = await vaultService.listVaults(filter);

    return NextResponse.json(result);
}

/**
 * POST /api/vaults - Create a new vault
 */
async function createVaultHandler(request: NextRequest) {
    await ensureBootstrap();
    const params = getRepoParams();
    const vaultService = new VaultServiceImpl(params);

    const body = await request.json();
    const vaultRequest = new VaultRequest(
        body.name,
        body.description ?? null,
        body.iconUrl ?? null,
        body.color ?? null,
        body.metadata ?? null
    );

    const result = await vaultService.createVault(vaultRequest);

    return NextResponse.json(result.toJson(), { status: 201 });
}

export const GET = withApiHandler(listVaultsHandler);
export const POST = withApiHandler(createVaultHandler);

