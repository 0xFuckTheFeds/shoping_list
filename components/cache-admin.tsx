"use client"

import { useState } from "react"
import { CacheStatus } from "./cache-status"
import { refreshAllData, clearCacheEntries } from "@/app/actions/cache-actions"

interface CacheAdminProps {
  initialStatus: {
    lastUpdate: number
    nextUpdate: number
    cacheHealth: "fresh" | "stale" | "error"
    usingRedis: boolean
  }
  initialKeys: string[]
}

export function CacheAdmin({ initialStatus, initialKeys }: CacheAdminProps) {
  const [status, setStatus] = useState(initialStatus)
  const [keys, setKeys] = useState(initialKeys)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [message, setMessage] = useState("")

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setMessage("")

    try {
      const result = await refreshAllData()

      if (result.success) {
        setMessage(`Success: ${result.message}`)
        // Update status after refresh
        setStatus({
          ...status,
          lastUpdate: Date.now(),
          nextUpdate: Date.now() + 2.5 * 60 * 60 * 1000,
          cacheHealth: "fresh",
        })
      } else {
        setMessage(`Error: ${result.message}`)
      }
    } catch (error) {
      setMessage("Error: Failed to refresh data")
      console.error(error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleClearCache = async (key: string) => {
    setIsClearing(true)
    setMessage("")

    try {
      const result = await clearCacheEntries([key])

      if (result.success) {
        setMessage(`Success: Cleared ${key}`)
        // Remove the key from the list
        setKeys(keys.filter((k) => k !== key))
      } else {
        setMessage(`Error: ${result.message}`)
      }
    } catch (error) {
      setMessage("Error: Failed to clear cache")
      console.error(error)
    } finally {
      setIsClearing(false)
    }
  }

  const handleClearAllCache = async () => {
    setIsClearing(true)
    setMessage("")

    try {
      const result = await clearCacheEntries(keys)

      if (result.success) {
        setMessage("Success: Cleared all cache entries")
        setKeys([])
        // Update status after clearing
        setStatus({
          ...status,
          cacheHealth: "stale",
        })
      } else {
        setMessage(`Error: ${result.message}`)
      }
    } catch (error) {
      setMessage("Error: Failed to clear cache")
      console.error(error)
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Cache Status</h2>
        <CacheStatus
          lastUpdate={status.lastUpdate}
          nextUpdate={status.nextUpdate}
          cacheHealth={status.cacheHealth}
          onRefresh={handleRefresh}
        />

        <div className="mt-2">
          <span className={`text-sm ${status.usingRedis ? "text-green-600" : "text-yellow-600"}`}>
            {status.usingRedis ? "Using Upstash Redis" : "Using memory fallback (Redis not available)"}
          </span>
        </div>

        <div className="mt-4">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isRefreshing ? "Refreshing..." : "Refresh All Data"}
          </button>

          <button
            onClick={handleClearAllCache}
            disabled={isClearing || keys.length === 0}
            className="ml-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            {isClearing ? "Clearing..." : "Clear All Cache"}
          </button>
        </div>

        {message && (
          <div
            className={`mt-4 p-2 rounded ${message.startsWith("Error") ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
          >
            {message}
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Cache Keys ({keys.length})</h2>

        {keys.length === 0 ? (
          <p className="text-gray-500">No cache keys found</p>
        ) : (
          <ul className="space-y-2">
            {keys.map((key) => (
              <li key={key} className="flex justify-between items-center p-2 bg-white rounded">
                <span className="font-mono text-sm">{key}</span>
                <button
                  onClick={() => handleClearCache(key)}
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Clear
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Cache Configuration</h2>
        <div className="space-y-2">
          <div>
            <span className="font-semibold">Cache Duration:</span> 2.5 hours
          </div>
          <div>
            <span className="font-semibold">Environment:</span> {process.env.VERCEL_ENV || "development"}
          </div>
          <div>
            <span className="font-semibold">API Enabled:</span> {process.env.ENABLE_DUNE_API === "true" ? "Yes" : "No"}
          </div>
          <div>
            <span className="font-semibold">Redis Available:</span> {status.usingRedis ? "Yes" : "No"}
          </div>
        </div>
      </div>
    </div>
  )
}
