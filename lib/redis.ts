import { kv } from "@vercel/kv"

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
  MARKET_CAP_TIME_LAST_REFRESH: "dashcoin:market_cap_time_last_refresh",
  ALL_TOKENS_LAST_REFRESH: "dashcoin:all_tokens_last_refresh",
  TOKEN_MARKET_CAPS_LAST_REFRESH: "dashcoin:token_market_caps_last_refresh",
  MARKET_STATS_LAST_REFRESH: "dashcoin:market_stats_last_refresh",
  REFRESH_IN_PROGRESS: "dashcoin:refresh_in_progress",
}

export const CACHE_DURATION = 1 * 60 * 60 * 1000  
export const CACHE_DURATION_LONG = 1 * 60 * 60 * 1000 

const isKvAvailable = typeof kv !== "undefined" && kv !== null

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

export async function getQueryLastRefreshTime(queryType: string): Promise<Date> {
  try {
    const timestamp = await getFromCache<number>(queryType);
    return timestamp ? new Date(timestamp) : new Date(0); 
  } catch (error) {
    console.error(`Error getting refresh time for ${queryType}:`, error);
    return new Date(0); 
  }
}

export async function setQueryLastRefreshTime(queryType: string): Promise<void> {
  try {
    const now = Date.now();
    await setInCache(queryType, now);
  } catch (error) {
    console.error(`Error setting refresh time for ${queryType}:`, error);
  }
}

export async function getLastRefreshTime(): Promise<Date | null> {
  try {
    const timestamp = await getFromCache<number>(CACHE_KEYS.LAST_REFRESH_TIME)
    return timestamp ? new Date(timestamp) : null
  } catch (error) {
    console.error("Error getting last refresh time:", error)
    return null
  }
}

export async function getNextRefreshTime(): Promise<Date | null> {
  try {
    const timestamp = await getFromCache<number>(CACHE_KEYS.NEXT_REFRESH_TIME)
    return timestamp ? new Date(timestamp) : null
  } catch (error) {
    console.error("Error getting next refresh time:", error)
    return null
  }
}

export async function getQueryTimeUntilNextRefresh(
  queryType: string, 
  refreshInterval: number
): Promise<{
  timeRemaining: number;
  lastRefreshTime: Date;
}> {
  try {
    const lastRefreshTime = await getQueryLastRefreshTime(queryType);
    const nextRefreshTime = new Date(lastRefreshTime.getTime() + refreshInterval);
    const timeRemaining = Math.max(0, nextRefreshTime.getTime() - Date.now());
    
    return {
      timeRemaining,
      lastRefreshTime
    };
  } catch (error) {
    console.error(`Error getting time until next refresh for ${queryType}:`, error);
    return {
      timeRemaining: 0,
      lastRefreshTime: new Date(0)
    };
  }
}

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
    return {
      timeRemaining: 0,
      lastRefreshTime: null,
      nextRefreshTime: null,
    }
  }
}

export async function acquireRefreshLock(): Promise<boolean> {
  if (!isKvAvailable) {
    console.warn("KV is not available, skipping lock acquisition")
    return true
  }

  try {
    const result = await kv.set(
      CACHE_KEYS.REFRESH_IN_PROGRESS,
      Date.now(),
      { nx: true, ex: 300 }, 
    )

    return result === "OK"
  } catch (error) {
    console.error("Error acquiring refresh lock:", error)
    return false
  }
}

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

export async function clearCache(key?: string): Promise<void> {
  if (!isKvAvailable) {
    console.warn("KV is not available, skipping cache clear")
    return
  }

  try {
    if (key) {
      await kv.del(key)
    } else {
      const keys = Object.values(CACHE_KEYS)
      for (const key of keys) {
        await kv.del(key)
      }
    }
  } catch (error) {
    console.error("Error clearing cache:", error)
  }
}