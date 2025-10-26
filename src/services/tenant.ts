import { injectable } from "tsyringe";
import { TenantFilter, TenantRequest, TenantUpdateRequest, TenantResponse } from "@/domain";
import { RepoParams } from "@/core/di";
import { Err } from "@/types";

// Service interface
export interface TenantService {
    getTenantById(id: string): Promise<TenantResponse | null>;
    createTenant(request: TenantRequest): Promise<TenantResponse>;
    listTenants(filter?: TenantFilter): Promise<TenantResponse[]>;
    updateTenant(id: string, request: TenantUpdateRequest): Promise<TenantResponse>;
    deleteTenant(id: string): Promise<void>;
    getTenantsByIds(ids: string[]): Promise<TenantResponse[]>;
}

// Implementation
@injectable()
export class TenantServiceImpl implements TenantService {
    constructor(private readonly params: RepoParams) { }

    async getTenantById(id: string): Promise<TenantResponse | null> {
        const { data, error } = await this.params.tenantRepository.findById(id);
        if (error) throw error;
        return data ? TenantResponse.fromDomain(data) : null;
    }

    async createTenant(request: TenantRequest): Promise<TenantResponse> {
        request.validate();

        const tenant = request.toDomain();
        const { data, error } = await this.params.tenantRepository.create(tenant);
        if (error) throw error;
        return TenantResponse.fromDomain(data);
    }

    async listTenants(filter?: TenantFilter): Promise<TenantResponse[]> {
        const { data, error } = await this.params.tenantRepository.findAll(filter);
        if (error) throw error;
        return data.map(TenantResponse.fromDomain);
    }

    async updateTenant(id: string, request: TenantUpdateRequest): Promise<TenantResponse> {
        request.validate();

        const existingTenant = await this.getTenantById(id);
        if (!existingTenant) {
            throw Err.notFound(`Tenant with ID ${id} not found`);
        }

        const { data: tenantEntity, error: fetchError } = await this.params.tenantRepository.findById(id);
        if (fetchError) throw fetchError;
        if (!tenantEntity) {
            throw Err.notFound(`Tenant with ID ${id} not found`);
        }

        const updatedTenant = tenantEntity.with({
            ...request,
            updatedAt: new Date(),
        });

        const { data, error } = await this.params.tenantRepository.update(updatedTenant);
        if (error) throw error;
        return TenantResponse.fromDomain(data);
    }

    async deleteTenant(id: string): Promise<void> {
        const { error } = await this.params.tenantRepository.delete(id);
        if (error) throw error;
        return undefined;
    }

    async getTenantsByIds(ids: string[]): Promise<TenantResponse[]> {
        const { data, error } = await this.params.tenantRepository.findByIds(ids);
        if (error) throw error;
        return data.map(TenantResponse.fromDomain);
    }
}
