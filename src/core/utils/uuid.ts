import { ulid } from 'ulid'

/**
 * GenerateUUID returns a k-sortable unique identifier
 */
export function generateUUID(): string {
    return ulid()
}

/**
 * GenerateUUIDWithPrefix returns a k-sortable unique identifier
 * with a prefix ex inv_0ujsswThIGTUYm2K8FjOOfXtY1K
 */
export function generateUUIDWithPrefix(prefix: string): string {
    if (prefix === '') {
        return generateUUID()
    }
    return `${prefix}_${generateUUID()}`
}

/**
 * GenerateShortIDWithPrefix returns a short ID with a prefix.
 * Total length is capped at 12 characters, e.g., `in_xYZ12A8Q`.
 */
export function generateShortIDWithPrefix(prefix: string): string {
    const id = generateUUID().replace(/-/g, '').toUpperCase()

    const availableLen = 12 - prefix.length
    if (availableLen <= 0) {
        return ''
    }

    const shortId = id.length > availableLen ? id.substring(0, availableLen) : id
    return `${prefix}${shortId}`
}

// Prefixes for all domains and entities
export const UUID_PREFIX = {
    SUBSCRIPTION_SCHEDULE: 'sched',
    SUBSCRIPTION_SCHEDULE_PHASE: 'phase',
    CREDIT_GRANT_APPLICATION: 'cga',
    CREDIT_NOTE: 'cn',
    FEATURE: 'feat',
    EVENT: 'event',
    METER: 'meter',
    PLAN: 'plan',
    PRICE: 'price',
    INVOICE: 'inv',
    INVOICE_LINE_ITEM: 'inv_line',
    SUBSCRIPTION: 'subs',
    SUBSCRIPTION_LINE_ITEM: 'subs_line',
    SUBSCRIPTION_PAUSE: 'pause',
    SUBSCRIPTION_CHANGE: 'subsc',
    CUSTOMER: 'cust',
    CONNECTION: 'conn',
    WALLET: 'wallet',
    WALLET_TRANSACTION: 'wtxn',
    ENVIRONMENT: 'env',
    USER: 'user',
    TENANT: 'tenant',
    ENTITLEMENT: 'ent',
    PAYMENT: 'pay',
    PAYMENT_ATTEMPT: 'attempt',
    TASK: 'task',
    SECRET: 'secret',
    TAX_RATE: 'taxrate',
    TAX_ASSOCIATION: 'ta',
    TAX_APPLIED: 'taxapp',
    CREDIT_GRANT: 'cg',
    COSTSHEET: 'cost',
    CREDIT_NOTE_LINE_ITEM: 'cn_line',
    ENTITY_INTEGRATION_MAPPING: 'eim',
    COUPON: 'coupon',
    COUPON_ASSOCIATION: 'coupon_assoc',
    COUPON_APPLICATION: 'coupon_app',
    PRICE_UNIT: 'price_unit',
    ADDON: 'addon',
    ADDON_ASSOCIATION: 'addon_assoc',
    WEBHOOK_EVENT: 'webhook',
    SETTING: 'setting',
    ALERT_LOG: 'alert',
    // Temporal workflow prefixes
    WORKFLOW: 'wf',
    RUN: 'run',
} as const

export const SHORT_ID_PREFIX = {
    CREDIT_NOTE: 'CN-',
} as const

/**
 * GenerateWorkflowID generates a unique workflow ID with workflow prefix
 */
export function generateWorkflowID(): string {
    return generateUUIDWithPrefix(UUID_PREFIX.WORKFLOW)
}

/**
 * GenerateWorkflowIDForType generates a workflow ID with both workflow prefix and type
 * Example: "wf_PriceSyncWorkflow_01HQXYZ123ABC"
 */
export function generateWorkflowIDForType(workflowType: string): string {
    if (workflowType === '') {
        return generateWorkflowID()
    }
    return `${UUID_PREFIX.WORKFLOW}_${workflowType}_${generateUUID()}`
}

/**
 * GenerateTemporalRunID generates a unique run ID for temporal workflows
 */
export function generateTemporalRunID(): string {
    return generateUUIDWithPrefix(UUID_PREFIX.RUN)
}

/**
 * GenerateWorkflowIDWithContext generates a contextual workflow ID
 * Example: "wf_PriceSyncWorkflow_plan123_01HQXYZ123ABC"
 */
export function generateWorkflowIDWithContext(workflowType: string, contextID: string): string {
    if (workflowType === '') {
        return generateWorkflowID()
    }
    if (contextID === '') {
        return generateWorkflowIDForType(workflowType)
    }
    return `${UUID_PREFIX.WORKFLOW}_${workflowType}_${contextID}_${generateUUID()}`
}

// Convenience functions for common entity types
export const generateUserID = () => generateUUIDWithPrefix(UUID_PREFIX.USER)
export const generateCustomerID = () => generateUUIDWithPrefix(UUID_PREFIX.CUSTOMER)
export const generateInvoiceID = () => generateUUIDWithPrefix(UUID_PREFIX.INVOICE)
export const generateSubscriptionID = () => generateUUIDWithPrefix(UUID_PREFIX.SUBSCRIPTION)
export const generatePaymentID = () => generateUUIDWithPrefix(UUID_PREFIX.PAYMENT)
export const generateWalletID = () => generateUUIDWithPrefix(UUID_PREFIX.WALLET)
export const generateTenantID = () => generateUUIDWithPrefix(UUID_PREFIX.TENANT)
export const generatePlanID = () => generateUUIDWithPrefix(UUID_PREFIX.PLAN)
export const generatePriceID = () => generateUUIDWithPrefix(UUID_PREFIX.PRICE)
export const generateFeatureID = () => generateUUIDWithPrefix(UUID_PREFIX.FEATURE)
export const generateEventID = () => generateUUIDWithPrefix(UUID_PREFIX.EVENT)
export const generateTaskID = () => generateUUIDWithPrefix(UUID_PREFIX.TASK)
export const generateSecretID = () => generateUUIDWithPrefix(UUID_PREFIX.SECRET)
export const generateWebhookEventID = () => generateUUIDWithPrefix(UUID_PREFIX.WEBHOOK_EVENT)
export const generateSettingID = () => generateUUIDWithPrefix(UUID_PREFIX.SETTING)
