import "reflect-metadata";
import { container } from "tsyringe";
import { db } from "@/core/db/client";
import type { Database, TransactionDatabase } from "@/core/db/client";
import { UserRepositoryImpl, type UserRepository, TenantRepositoryImpl, type TenantRepository } from "@/domain";
import { injectable } from "tsyringe";

// DI Tokens
export const DB_TOKEN = "DB";
export const REPO_PARAMS_TOKEN = "RepoParams";

// Bootstrap state
let _bootstrapPromise: Promise<void> | null = null;
let _initialized = false;

/**
 * Simple container for all repositories
 */
@injectable()
export class RepoParams {
    readonly userRepository: UserRepository;
    readonly tenantRepository: TenantRepository;

    constructor(private readonly db: Database | TransactionDatabase) {
        this.userRepository = new UserRepositoryImpl(db as Database);
        this.tenantRepository = new TenantRepositoryImpl(db as Database);
    }

    static withTransaction(tx: Database | TransactionDatabase): RepoParams {
        return new RepoParams(tx);
    }
}

/**
 * Initialize DI container
 */
export function bootstrap(): Promise<void> {
    if (_bootstrapPromise) return _bootstrapPromise;

    _bootstrapPromise = (async () => {
        try {
            // Register DB
            container.register(DB_TOKEN, { useValue: db });

            // Register repository params
            const repoParams = new RepoParams(db);
            container.register(REPO_PARAMS_TOKEN, { useValue: repoParams });

            console.log("[Bootstrap] ✅ DI container initialized");
        } catch (error) {
            console.error("[Bootstrap] ❌ Failed to initialize DI container:", error);
            _bootstrapPromise = null;
            throw error;
        }
    })();

    return _bootstrapPromise;
}

/**
 * Ensures bootstrap runs once per server process
 */
export async function ensureBootstrap(): Promise<void> {
    if (_initialized) return;

    if (!_bootstrapPromise) {
        _bootstrapPromise = bootstrap()
            .then(() => {
                _initialized = true;
            })
            .catch((err) => {
                _bootstrapPromise = null;
                throw err;
            });
    }

    await _bootstrapPromise;
}

/**
 * Reset bootstrap state (for testing)
 */
export function resetBootstrap(): void {
    _initialized = false;
    _bootstrapPromise = null;
    container.clearInstances();
}

/**
 * Get repository params from container
 */
export function getRepoParams(): RepoParams {
    return container.resolve<RepoParams>(REPO_PARAMS_TOKEN);
}
