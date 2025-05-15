// This file handles persistent caching using Vercel KV (Redis)
// If Vercel KV is not available, it falls back to a more basic solution

import { kv } from "@vercel/kv"

// Check if Vercel KV is available
const hasVercelKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)

// Cache keys
const CACHE_KEYS = {
  TOKEN_DATA: "believe:token-data:5140151", // Updated to include query ID
  MARKET_CAP_TIME_DATA: "believe:market-cap-time-data:5119241", // Specific for market cap time data
  LAST_FETCH_TIME: "believe:last-fetch-time:5140151", // Updated to include query ID
  LAST_MARKET_CAP_FETCH_TIME: "believe:last-fetch-time:5119241", // Specific for market cap time data
}

// Add this after the CACHE_KEYS definition
// List of disabled queries that should never be executed directly
const DISABLED_QUERIES = [5129959, 5130872, 5129347, 5119173]

// In-memory fallback cache (used if Vercel KV is not available)
const memoryCache = new Map<string, any>()

/**
 * Get data from cache
 */
export async function getCacheItem<T>(key: string): Promise<T | null> {
  try {
    if (hasVercelKV) {
      // Use Vercel KV if available
      return await kv.get(key)
    } else {
      // Fall back to memory cache
      return memoryCache.get(key) || null
    }
  } catch (error) {
    console.error(`Error getting cache item ${key}:`, error)
    return null
  }
}

/**
 * Set data in cache with expiration
 */
export async function setCacheItem(key: string, value: any, expirationSeconds?: number): Promise<void> {
  try {
    if (hasVercelKV) {
      // Use Vercel KV if available
      if (expirationSeconds) {
        await kv.set(key, value, { ex: expirationSeconds })
      } else {
        await kv.set(key, value)
      }
    } else {
      // Fall back to memory cache
      memoryCache.set(key, value)

      // Simulate expiration for memory cache
      if (expirationSeconds) {
        setTimeout(() => {
          memoryCache.delete(key)
        }, expirationSeconds * 1000)
      }
    }
  } catch (error) {
    console.error(`Error setting cache item ${key}:`, error)
  }
}

/**
 * Check if we should fetch from Dune based on cache status
 */
export async function shouldFetchFromDune(cacheKey: string, cacheDuration: number): Promise<boolean> {
  try {
    // First check if API calls are enabled
    if (!shouldUseRealAPI()) {
      return false
    }

    const lastFetchTime = await getCacheItem<number>(cacheKey)
    const now = Date.now()

    // If no record of last fetch or cache expired
    if (!lastFetchTime || now - lastFetchTime > cacheDuration) {
      // Update the last fetch time before making the call
      await setCacheItem(cacheKey, now)
      return true
    }

    return false
  } catch (error) {
    console.error("Error checking if should fetch from Dune:", error)
    // Fail safe - if we can't check the cache, don't make API calls
    return false
  }
}

/**
 * Check if we should use the real API based on environment
 */
export function shouldUseRealAPI(): boolean {
  // Only use real API when explicitly enabled
  const ENABLE_DUNE_API = process.env.ENABLE_DUNE_API === "true"

  // Comment out the production check for testing
  // const IS_PRODUCTION = process.env.VERCEL_ENV === "production"
  // return ENABLE_DUNE_API && IS_PRODUCTION

  // For testing, just check if API is enabled
  return ENABLE_DUNE_API
}

/**
 * Get the cache keys
 */
export { CACHE_KEYS }
