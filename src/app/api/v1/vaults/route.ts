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

// listVaultsHandler retrieves a paginated list of vaults with optional filtering
// @Summary List vaults with optional filtering and pagination
// @Description Retrieve a paginated list of vaults with optional filtering by status, name, color, and date range
// @Tags Vaults
// @Security bearerAuth
// @Produce json
// @Param limit query integer false "Number of items to return"
// @Param offset query integer false "Number of items to skip"
// @Param status query EntityStatus false "Filter by status"
// @Param sort query string false "Sort field"
// @Param order query SortOrder false "Sort order (asc or desc)"
// @Param nameContains query string false "Filter by name containing string"
// @Param color query string false "Filter by color (hex format)"
// @Param vaultIds query string false "Filter by specific vault IDs (comma-separated)"
// @Success 200 {object} array "Array of vaults with pagination"
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Router /api/v1/vaults [get]
async function listVaultsHandler(request: NextRequest) {
    await ensureBootstrap();
    const params = getRepoParams();
    const vaultService = new VaultServiceImpl(params);

    const filter = parseVaultFilterFromQuery(request);
    const result = await vaultService.listVaults(filter);

    return NextResponse.json(result);
}

// createVaultHandler handles the creation of a new vault
// @Summary Create a new vault
// @Description Creates a new vault with the provided details. Name is required, other fields are optional.
// @Tags Vaults
// @Security bearerAuth
// @Accept json
// @Produce json
// @Param body body VaultRequest true "Vault details"
// @Success 201 {object} VaultResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Router /api/v1/vaults [post]
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

