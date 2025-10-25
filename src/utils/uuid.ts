import { ulid } from 'ulid'

/**
 * GenerateUUID returns a k-sortable unique identifier
 */
export function generateUUID(): string {
  return ulid()
}

/**
 * GenerateUUIDWithPrefix returns a k-sortable unique identifier
 * with a prefix ex user_0ujsswThIGTUYm2K8FjOOfXtY1K
 */
export function generateUUIDWithPrefix(prefix: UUID_PREFIX): string {
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
export enum UUID_PREFIX {
  USER = 'user',
}

export enum SHORT_ID_PREFIX {
}



