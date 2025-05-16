import { kv } from "@vercel/kv"

// Cache keys
export const CACHE_KEYS = {
  ALL_TOKENS: "dashcoin:all_tokens",
  VOLUME_TOKENS: "dashcoin:volume_tokens",
  MARKET_CAP_TIME: "dashcoin:market_cap_time",
  TOKEN_MARKET_CAPS: "dashcoin:token_market_caps",
  TOTAL_MARKET_CAP: "dashcoin:total_market_cap",
  NEW_TOKENS: "dashcoin:new_tokens",
  MARKET_STATS: "dashcoin:market_stats",
  LAST_REFRESH_TIME: "dashcoin:last_refresh_time",
  NEXT_REFRESH_TIME: "dashcoin:next_refresh_time",
  REFRESH_IN_PROGRESS: "dashcoin:refresh_in_progress",
}

// Cache duration in milliseconds (4 hours)
export const CACHE_DURATION = 1 * 60 * 60 * 1000

// Check if KV is available
const isKvAvailable = typeof kv !== "undefined" && kv !== null

/**
 * Get data from Redis cache with fallback
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  if (!isKvAvailable) {
    console.warn("KV is not available, using fallback")
    return null
  }

  try {
    return await kv.get(key)
  } catch (error) {
    console.error(`Error getting ${key} from cache:`, error)
    return null
  }
}

/**
 * Set data in Redis cache with fallback
 */
export async function setInCache(key: string, data: any, expirationMs?: number): Promise<void> {
  if (!isKvAvailable) {
    console.warn("KV is not available, skipping cache set")
    return
  }

  try {
    if (expirationMs) {
      await kv.set(key, data, { ex: Math.floor(expirationMs / 1000) })
    } else {
      await kv.set(key, data)
    }
  } catch (error) {
    console.error(`Error setting ${key} in cache:`, error)
  }
}

/**
 * Get the last refresh time from cache
 */
export async function getLastRefreshTime(): Promise<Date | null> {
  try {
    const timestamp = await getFromCache<number>(CACHE_KEYS.LAST_REFRESH_TIME)
    return timestamp ? new Date(timestamp) : null
  } catch (error) {
    console.error("Error getting last refresh time:", error)
    return null
  }
}

/**
 * Get the next scheduled refresh time from cache
 */
export async function getNextRefreshTime(): Promise<Date | null> {
  try {
    const timestamp = await getFromCache<number>(CACHE_KEYS.NEXT_REFRESH_TIME)
    return timestamp ? new Date(timestamp) : null
  } catch (error) {
    console.error("Error getting next refresh time:", error)
    return null
  }
}

/**
 * Calculate time remaining until next refresh
 */
export async function getTimeUntilNextRefresh(): Promise<{
  timeRemaining: number
  lastRefreshTime: Date | null
  nextRefreshTime: Date | null
}> {
  try {
    const lastRefreshTime = await getLastRefreshTime()
    const nextRefreshTime = await getNextRefreshTime()

    let timeRemaining = 0
    if (nextRefreshTime) {
      timeRemaining = Math.max(0, nextRefreshTime.getTime() - Date.now())
    }

    return {
      timeRemaining,
      lastRefreshTime,
      nextRefreshTime,
    }
  } catch (error) {
    console.error("Error calculating time until next refresh:", error)
    // Return default values in case of error
    return {
      timeRemaining: 0,
      lastRefreshTime: null,
      nextRefreshTime: null,
    }
  }
}

/**
 * Set a refresh lock to prevent multiple simultaneous refreshes
 * Returns true if lock was acquired, false otherwise
 */
export async function acquireRefreshLock(): Promise<boolean> {
  if (!isKvAvailable) {
    console.warn("KV is not available, skipping lock acquisition")
    return true
  }

  try {
    // Try to set the lock with NX option (only set if key doesn't exist)
    const result = await kv.set(
      CACHE_KEYS.REFRESH_IN_PROGRESS,
      Date.now(),
      { nx: true, ex: 300 }, // 5 minute expiration as safety
    )

    // If result is OK, we acquired the lock
    return result === "OK"
  } catch (error) {
    console.error("Error acquiring refresh lock:", error)
    return false
  }
}

/**
 * Release the refresh lock
 */
export async function releaseRefreshLock(): Promise<void> {
  if (!isKvAvailable) {
    console.warn("KV is not available, skipping lock release")
    return
  }

  try {
    await kv.del(CACHE_KEYS.REFRESH_IN_PROGRESS)
  } catch (error) {
    console.error("Error releasing refresh lock:", error)
  }
}

// Add this function to clear the cache
export async function clearCache(key?: string): Promise<void> {
  if (!isKvAvailable) {
    console.warn("KV is not available, skipping cache clear")
    return
  }

  try {
    if (key) {
      // Clear specific key
      await kv.del(key)
    } else {
      // Clear all dashcoin cache keys
      const keys = Object.values(CACHE_KEYS)
      for (const key of keys) {
        await kv.del(key)
      }
    }
  } catch (error) {
    console.error("Error clearing cache:", error)
  }
}
