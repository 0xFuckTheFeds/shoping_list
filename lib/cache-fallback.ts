// In-memory fallback cache for when Redis is unavailable
const memoryCache = new Map<string, { data: any; expiry: number }>()

/**
 * Get data from memory cache
 */
export function getFromMemoryCache<T>(key: string): T | null {
  const cached = memoryCache.get(key)
  if (!cached) return null

  // Check if expired
  if (cached.expiry < Date.now()) {
    memoryCache.delete(key)
    return null
  }

  return cached.data as T
}

/**
 * Set data in memory cache with expiration
 */
export function setInMemoryCache(key: string, data: any, expirationSeconds: number): void {
  const expiry = Date.now() + expirationSeconds * 1000
  memoryCache.set(key, { data, expiry })
}

/**
 * Clear memory cache
 */
export function clearMemoryCache(keys?: string[]): void {
  if (!keys || keys.length === 0) {
    memoryCache.clear()
    return
  }

  keys.forEach((key) => memoryCache.delete(key))
}

/**
 * Get all memory cache keys
 */
export function getAllMemoryCacheKeys(): string[] {
  return Array.from(memoryCache.keys())
}
