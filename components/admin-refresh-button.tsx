"use client"

import { useState } from "react"
import { DashcoinButton } from "@/components/ui/dashcoin-button"
import { forceDuneDataRefresh } from "@/app/actions/dune-actions"
import { RefreshCw, CheckCircle, XCircle } from "lucide-react"

interface AdminRefreshButtonProps {
  className?: string
}

export function AdminRefreshButton({ className = "" }: AdminRefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshStatus, setRefreshStatus] = useState<"idle" | "success" | "error">("idle")
  const [statusMessage, setStatusMessage] = useState("")

  const handleRefresh = async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    setRefreshStatus("idle")
    setStatusMessage("")

    try {
      const result = await forceDuneDataRefresh()

      if (result) {
        setRefreshStatus("success")
        setStatusMessage("Data refreshed successfully!")
      } else {
        setRefreshStatus("error")
        setStatusMessage("Refresh already in progress or skipped")
      }
    } catch (error) {
      console.error("Error refreshing data:", error)
      setRefreshStatus("error")
      setStatusMessage("Failed to refresh data")
    } finally {
      setIsRefreshing(false)

      // Reset status after 5 seconds
      setTimeout(() => {
        setRefreshStatus("idle")
        setStatusMessage("")
      }, 5000)
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <DashcoinButton onClick={handleRefresh} disabled={isRefreshing} size="sm" className="flex items-center gap-1">
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        <span className="no-underline" style={{ textShadow: "none" }}>
          {isRefreshing ? "Refreshing..." : "Refresh Data"}
        </span>
      </DashcoinButton>

      {refreshStatus === "success" && (
        <div className="flex items-center gap-1 text-dashGreen-accent">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">{statusMessage}</span>
        </div>
      )}

      {refreshStatus === "error" && (
        <div className="flex items-center gap-1 text-dashRed">
          <XCircle className="h-4 w-4" />
          <span className="text-sm">{statusMessage}</span>
        </div>
      )}
    </div>
  )
}
