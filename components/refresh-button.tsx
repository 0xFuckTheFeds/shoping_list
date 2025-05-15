"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"
import { DashcoinButton } from "@/components/ui/dashcoin-button"
import { triggerManualRefresh } from "@/app/actions/dune-actions"

interface RefreshButtonProps {
  onRefreshComplete?: () => void
  className?: string
}

export function RefreshButton({ onRefreshComplete, className = "" }: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [message, setMessage] = useState("")
  const [showMessage, setShowMessage] = useState(false)

  const handleRefresh = async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    setMessage("")
    setShowMessage(false)

    try {
      const result = await triggerManualRefresh()

      setMessage(result.message)
      setShowMessage(true)

      if (result.success && onRefreshComplete) {
        onRefreshComplete()
      }

      // Hide message after 5 seconds
      setTimeout(() => {
        setShowMessage(false)
      }, 5000)
    } catch (error) {
      setMessage("Error refreshing data. Please try again later.")
      setShowMessage(true)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <DashcoinButton onClick={handleRefresh} disabled={isRefreshing} size="sm" className="flex items-center gap-2">
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        {isRefreshing ? "Refreshing..." : "Refresh Data"}
      </DashcoinButton>

      {showMessage && (
        <div className="absolute top-full mt-2 right-0 bg-dashGreen-dark border border-dashYellow p-2 rounded-md text-xs whitespace-nowrap z-10">
          {message}
        </div>
      )}
    </div>
  )
}
