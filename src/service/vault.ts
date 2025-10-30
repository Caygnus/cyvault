import { injectable } from "tsyringe";
import { VaultFilter, VaultRequest, VaultUpdateRequest, VaultResponse } from "@/domain";
import { RepoParams } from "@/core/di";
import { Err, ListResponse, NewListResponse } from "@/types";
import RequestContext from "@/core/context/context";

// Service interface
export interface VaultService {
    getVaultById(id: string): Promise<VaultResponse | null>;
    createVault(request: VaultRequest): Promise<VaultResponse>;
    listVaults(filter?: VaultFilter): Promise<ListResponse<VaultResponse>>;
    updateVault(id: string, request: VaultUpdateRequest): Promise<VaultResponse>;
    deleteVault(id: string): Promise<void>;
}

// Implementation
@injectable()
export class VaultServiceImpl implements VaultService {
    constructor(private readonly params: RepoParams) { }

    async getVaultById(id: string): Promise<VaultResponse | null> {
        const { data, error } = await this.params.vaultRepository.findById(id);
        if (error) throw error;
        return data ? VaultResponse.fromDomain(data) : null;
    }

    async createVault(request: VaultRequest): Promise<VaultResponse> {
        request.validate();

        const vault = request.toDomain();
        const { data, error } = await this.params.vaultRepository.create(vault);
        if (error) throw error;
        return VaultResponse.fromDomain(data);
    }

    async listVaults(filter?: VaultFilter): Promise<ListResponse<VaultResponse>> {
        const usedFilter = filter || VaultFilter.createDefault();

        // Get items
        const { data, error } = await this.params.vaultRepository.findAll(usedFilter);
        if (error) throw error;
        const items = data.map(VaultResponse.fromDomain);

        // Get total count
        const { data: total, error: countError } = await this.params.vaultRepository.count(usedFilter);
        if (countError) throw countError;

        // Create paginated response
        return NewListResponse(
            items,
            total,
            usedFilter.getLimit(),
            usedFilter.getOffset()
        );
    }

    async updateVault(id: string, request: VaultUpdateRequest): Promise<VaultResponse> {
        request.validate();

        const existingVault = await this.getVaultById(id);
        if (!existingVault) {
            throw Err.notFound(`Vault with ID ${id} not found`);
        }

        const { data: vaultEntity, error: fetchError } = await this.params.vaultRepository.findById(id);
        if (fetchError) throw fetchError;
        if (!vaultEntity) {
            throw Err.notFound(`Vault with ID ${id} not found`);
        }

        // Update the vault with new values
        const updatedVault = vaultEntity.with({
            ...request,
            updatedAt: new Date(),
            updatedBy: RequestContext.tryGetUserId(),
        });

        const { data, error } = await this.params.vaultRepository.update(updatedVault);
        if (error) throw error;
        return VaultResponse.fromDomain(data);
    }

    async deleteVault(id: string): Promise<void> {
        const { error } = await this.params.vaultRepository.delete(id);
        if (error) throw error;
        return undefined;
    }
}

