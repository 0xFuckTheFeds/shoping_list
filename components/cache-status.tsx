"use client"

import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"

interface CacheStatusProps {
  lastUpdate: number
  nextUpdate: number
  cacheHealth: "fresh" | "stale" | "error"
  onRefresh?: () => void
}

export function CacheStatus({ lastUpdate, nextUpdate, cacheHealth, onRefresh }: CacheStatusProps) {
  const [timeAgo, setTimeAgo] = useState<string>("")
  const [nextUpdateIn, setNextUpdateIn] = useState<string>("")

  useEffect(() => {
    // Update the time ago text
    if (lastUpdate) {
      setTimeAgo(formatDistanceToNow(lastUpdate, { addSuffix: true }))
    }

    // Update the next update text
    if (nextUpdate) {
      setNextUpdateIn(formatDistanceToNow(nextUpdate, { addSuffix: true }))
    }

    // Update every minute
    const interval = setInterval(() => {
      if (lastUpdate) {
        setTimeAgo(formatDistanceToNow(lastUpdate, { addSuffix: true }))
      }
      if (nextUpdate) {
        setNextUpdateIn(formatDistanceToNow(nextUpdate, { addSuffix: true }))
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [lastUpdate, nextUpdate])

  // Determine status color
  const statusColor =
    cacheHealth === "fresh" ? "bg-green-500" : cacheHealth === "stale" ? "bg-yellow-500" : "bg-red-500"

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className={`w-3 h-3 rounded-full ${statusColor}`} />
      <div>
        <span>Data updated: {timeAgo}</span>
        {cacheHealth === "fresh" && <span className="ml-2 text-gray-500">Next update: {nextUpdateIn}</span>}
        {cacheHealth !== "fresh" && onRefresh && (
          <button onClick={onRefresh} className="ml-2 text-blue-500 hover:underline">
            Refresh now
          </button>
        )}
      </div>
    </div>
  )
}
