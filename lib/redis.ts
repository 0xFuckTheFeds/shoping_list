import { Redis } from "@upstash/redis"
import { getFromMemoryCache, setInMemoryCache, clearMemoryCache, getAllMemoryCacheKeys } from "./cache-fallback"

// Check if we have the required environment variables
const hasUpstashCredentials = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)

// Initialize Redis client if credentials are available
let redis: Redis | null = null

if (hasUpstashCredentials) {
  try {
    redis = new Redis({
      url: process.env.KV_REST_API_URL || "",
      token: process.env.KV_REST_API_TOKEN || "",
    })
    console.log("Upstash Redis client initialized successfully")
  } catch (error) {
    console.error("Failed to initialize Upstash Redis client:", error)
    redis = null
  }
}

// Cache keys
export const CACHE_KEYS = {
  TOKEN_DATA: "believe:token-data",
  MARKET_STATS: "believe:market-stats",
  LAST_FETCH_TIME: "believe:last-fetch-time",
  VOLUME_DATA: "believe:volume-data",
  LAST_VOLUME_FETCH_TIME: "believe:last-volume-fetch-time",
}

// Cache duration (2.5 hours in seconds)
export const CACHE_DURATION = 2.5 * 60 * 60

/**
 * Get data from Redis cache with fallback to memory cache
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  // Try Redis first if available
  if (redis) {
    try {
      const data = await redis.get(key)
      return (data as T) || null
    } catch (error) {
      console.error(`Error getting data from Redis cache (${key}):`, error)
      // Fall back to memory cache
    }
  }

  // Use memory cache as fallback
  return getFromMemoryCache<T>(key)
}

/**
 * Set data in Redis cache with fallback to memory cache
 */
export async function setInCache(key: string, data: any, expirationSeconds = CACHE_DURATION): Promise<void> {
  // Try Redis first if available
  if (redis) {
    try {
      await redis.set(key, data, { ex: expirationSeconds })
      return
    } catch (error) {
      console.error(`Error setting data in Redis cache (${key}):`, error)
      // Fall back to memory cache
    }
  }

  // Use memory cache as fallback
  setInMemoryCache(key, data, expirationSeconds)
}

/**
 * Check if cache is valid (not expired)
 */
export async function isCacheValid(key: string): Promise<boolean> {
  // Try Redis first if available
  if (redis) {
    try {
      const ttl = await redis.ttl(key)
      return ttl > 0
    } catch (error) {
      console.error(`Error checking cache validity (${key}):`, error)
      // Fall back to memory cache
    }
  }

  // For memory cache, if we can get the data, it's valid (getFromMemoryCache checks expiry)
  return getFromMemoryCache(key) !== null
}

/**
 * Get cache status information
 */
export async function getCacheStatus(): Promise<{
  lastUpdate: number
  nextUpdate: number
  cacheHealth: "fresh" | "stale" | "error"
  usingRedis: boolean
}> {
  try {
    // Get last fetch time
    const lastFetchTime = (await getFromCache<number>(CACHE_KEYS.LAST_FETCH_TIME)) || 0

    let ttl = -1

    // Get TTL of token data
    if (redis) {
      try {
        ttl = await redis.ttl(CACHE_KEYS.TOKEN_DATA)
      } catch (error) {
        console.error("Error getting TTL from Redis:", error)
      }
    }

    // Calculate next update time
    const nextUpdateTime = ttl > 0 ? Date.now() + ttl * 1000 : Date.now()

    // Determine cache health
    let cacheHealth: "fresh" | "stale" | "error" = "fresh"

    if (ttl <= 0 || !lastFetchTime) {
      cacheHealth = "stale"
    }

    if (Date.now() - lastFetchTime > CACHE_DURATION * 1000 * 2) {
      // If cache is more than twice the cache duration old, consider it an error
      cacheHealth = "error"
    }

    return {
      lastUpdate: lastFetchTime,
      nextUpdate: nextUpdateTime,
      cacheHealth,
      usingRedis: !!redis,
    }
  } catch (error) {
    console.error("Error getting cache status:", error)
    return {
      lastUpdate: 0,
      nextUpdate: 0,
      cacheHealth: "error",
      usingRedis: !!redis,
    }
  }
}

/**
 * Clear specific cache entries
 */
export async function clearCache(keys: string[]): Promise<void> {
  // Try Redis first if available
  if (redis) {
    try {
      for (const key of keys) {
        await redis.del(key)
      }
    } catch (error) {
      console.error("Error clearing Redis cache:", error)
    }
  }

  // Also clear memory cache
  clearMemoryCache(keys)
}

/**
 * Get all cache keys (for debugging)
 */
export async function getAllCacheKeys(): Promise<string[]> {
  const keys: string[] = []

  // Try Redis first if available
  if (redis) {
    try {
      const redisKeys = await redis.keys("believe:*")
      keys.push(...redisKeys)
    } catch (error) {
      console.error("Error getting Redis cache keys:", error)
    }
  }

  // Also get memory cache keys
  const memoryKeys = getAllMemoryCacheKeys()

  // Combine and deduplicate
  return Array.from(new Set([...keys, ...memoryKeys]))
}
