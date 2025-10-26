import { AsyncLocalStorage } from 'async_hooks';
import { UserHeaders } from '@/core/middleware/middleware';

export interface RequestContextStore {
    requestId: string;
    requestPath: string;
    requestMethod: string;
    requestStartTime: number;
    [UserHeaders.USER_ID]?: string;
    [UserHeaders.USER_EMAIL]?: string;
    [UserHeaders.TENANT_ID]?: string;
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContextStore>();

export class NoContextError extends Error {
    constructor(message = 'No context available') {
        super(message);
        this.name = 'NoContextError';
    }
}

export class ContextKeyError extends Error {
    constructor(key: string, message = 'Context key not found') {
        super(`${message}: ${key}`);
        this.name = 'ContextKeyError';
    }
}

export default class RequestContext {
    static getContext(): RequestContextStore {
        const context = asyncLocalStorage.getStore();
        if (!context) {
            throw new NoContextError();
        }
        return context;
    }

    static hasContext(): boolean {
        return asyncLocalStorage.getStore() !== undefined;
    }

    static run<T>(store: RequestContextStore, fn: () => T): T {
        return asyncLocalStorage.run(store, fn);
    }

    static get<K extends keyof RequestContextStore>(key: K): RequestContextStore[K] {
        const context = this.getContext();
        if (!(key in context)) {
            throw new ContextKeyError(key as string);
        }
        return context[key];
    }

    static set<K extends keyof RequestContextStore>(key: K, value: RequestContextStore[K]): void {
        const context = this.getContext();
        context[key] = value;
    }

    static tryGet<K extends keyof RequestContextStore>(key: K): RequestContextStore[K] | undefined {
        const context = asyncLocalStorage.getStore();
        return context?.[key];
    }

    static getUserId(): string {
        const userId = this.get(UserHeaders.USER_ID);
        if (!userId) {
            throw new NoContextError('User ID not found in context');
        }
        return userId;
    }

    static tryGetUserId(): string | undefined {
        return this.tryGet(UserHeaders.USER_ID);
    }

    static getUserEmail(): string {
        const email = this.get(UserHeaders.USER_EMAIL);
        if (!email) {
            throw new NoContextError('User email not found in context');
        }
        return email;
    }

    static tryGetUserEmail(): string | undefined {
        return this.tryGet(UserHeaders.USER_EMAIL);
    }

    static getTenantId(): string {
        const tenantId = this.get(UserHeaders.TENANT_ID);
        if (!tenantId) {
            throw new NoContextError('Tenant ID not found in context');
        }
        return tenantId;
    }

    static tryGetTenantId(): string | undefined {
        return this.tryGet(UserHeaders.TENANT_ID);
    }

    static hasUser(): boolean {
        return !!(this.tryGetUserId() && this.tryGetUserEmail());
    }

    static hasTenant(): boolean {
        return !!this.tryGetTenantId();
    }

    static getRequestId(): string {
        return this.get('requestId');
    }

    static getRequestPath(): string {
        return this.get('requestPath');
    }

    static getRequestMethod(): string {
        return this.get('requestMethod');
    }

    static getRequestStartTime(): number {
        return this.get('requestStartTime');
    }

    static getRequestExecutionTime(): number {
        const startTime = this.getRequestStartTime();
        return Date.now() - startTime;
    }

    static getRequestDuration(): number {
        return this.getRequestExecutionTime();
    }

    static fromRequest<T>(req: Request, fn: () => T | Promise<T>): T | Promise<T> {
        const store: Partial<RequestContextStore> = {
            requestId: crypto.randomUUID(),
            requestPath: new URL(req.url).pathname,
            requestMethod: req.method,
            requestStartTime: Date.now(),
        };

        const userId = req.headers.get(UserHeaders.USER_ID);
        const userEmail = req.headers.get(UserHeaders.USER_EMAIL);
        const tenantId = req.headers.get(UserHeaders.TENANT_ID);

        if (userId) {
            store[UserHeaders.USER_ID] = userId;
        }

        if (userEmail) {
            store[UserHeaders.USER_EMAIL] = userEmail;
        }

        if (tenantId) {
            store[UserHeaders.TENANT_ID] = tenantId;
        }

        return this.run(store as RequestContextStore, fn);
    }

    static withValues<T>(values: Partial<RequestContextStore>, fn: () => T | Promise<T>): T | Promise<T> {
        const currentContext = asyncLocalStorage.getStore();
        if (!currentContext) {
            throw new NoContextError('Cannot create child context without parent context');
        }

        const newContext = { ...currentContext, ...values };
        return this.run(newContext, fn);
    }

    static tryWithValues<T>(values: Partial<RequestContextStore>, fn: () => T | Promise<T>): T | Promise<T> {
        const currentContext = asyncLocalStorage.getStore();
        if (!currentContext) {
            return fn();
        }

        const newContext = { ...currentContext, ...values };
        return this.run(newContext, fn);
    }

    static getAll(): RequestContextStore {
        return this.getContext();
    }

    static toJSON(): Record<string, unknown> {
        const context = asyncLocalStorage.getStore();
        if (!context) {
            return {};
        }

        return {
            requestId: context.requestId,
            requestPath: context.requestPath,
            requestMethod: context.requestMethod,
            requestStartTime: context.requestStartTime,
            userId: context[UserHeaders.USER_ID],
            userEmail: context[UserHeaders.USER_EMAIL],
            tenantId: context[UserHeaders.TENANT_ID],
        };
    }
}