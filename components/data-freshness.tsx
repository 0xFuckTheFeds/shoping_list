"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"

interface DataFreshnessProps {
  lastUpdated: number | string | Date
  className?: string
}

export function DataFreshness({ lastUpdated, className = "" }: DataFreshnessProps) {
  const [timeAgo, setTimeAgo] = useState("")

  useEffect(() => {
    // Convert lastUpdated to a Date object if it's not already
    const lastUpdatedDate =
      typeof lastUpdated === "number"
        ? new Date(lastUpdated)
        : typeof lastUpdated === "string"
          ? new Date(lastUpdated)
          : lastUpdated

    // Function to format the time ago
    const formatTimeAgo = () => {
      const now = new Date()
      const diffMs = now.getTime() - lastUpdatedDate.getTime()
      const diffMinutes = Math.floor(diffMs / 60000)

      if (diffMinutes < 1) {
        return "just now"
      } else if (diffMinutes < 60) {
        return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`
      } else {
        const diffHours = Math.floor(diffMinutes / 60)
        if (diffHours < 24) {
          return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`
        } else {
          const diffDays = Math.floor(diffHours / 24)
          return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`
        }
      }
    }

    // Set initial time ago
    setTimeAgo(formatTimeAgo())

    // Update time ago every minute
    const interval = setInterval(() => {
      setTimeAgo(formatTimeAgo())
    }, 60000)

    return () => clearInterval(interval)
  }, [lastUpdated])

  return (
    <div className={`flex items-center gap-1 text-xs opacity-70 ${className}`}>
      <Clock className="h-3 w-3" />
      <span>Data updated {timeAgo}</span>
    </div>
  )
}
