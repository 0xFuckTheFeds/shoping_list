"use server"

import { revalidatePath } from "next/cache"
import { clearCache, getCacheStatus, getAllCacheKeys } from "@/lib/redis"
import { fetchTokens, fetchMarketStats } from "@/lib/data-fetcher"

/**
 * Refresh all data and update cache
 */
export async function refreshAllData() {
  try {
    // Force refresh of all data
    await fetchTokens(true)
    await fetchMarketStats(true)

    // Revalidate all pages
    revalidatePath("/")

    return { success: true, message: "Data refreshed successfully" }
  } catch (error) {
    console.error("Error refreshing data:", error)
    return { success: false, message: "Failed to refresh data" }
  }
}

/**
 * Clear specific cache entries
 */
export async function clearCacheEntries(keys: string[]) {
  try {
    await clearCache(keys)
    revalidatePath("/")
    return { success: true, message: "Cache cleared successfully" }
  } catch (error) {
    console.error("Error clearing cache:", error)
    return { success: false, message: "Failed to clear cache" }
  }
}

/**
 * Get cache status information
 */
export async function fetchCacheStatus() {
  return await getCacheStatus()
}

/**
 * Get all cache keys (for debugging)
 */
export async function fetchAllCacheKeys() {
  return await getAllCacheKeys()
}
