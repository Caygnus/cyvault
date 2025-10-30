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
    USER: 'user',
    TENANT: 'tenant',
    VAULT: 'vault',
} as const

export const SHORT_ID_PREFIX = {
} as const


