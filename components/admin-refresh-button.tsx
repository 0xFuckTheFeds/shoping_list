"use client"

import { useState } from "react"
import { DashcoinButton } from "@/components/ui/dashcoin-button"
import { forceDuneDataRefresh } from "@/app/actions/dune-actions"
import { RefreshCw, CheckCircle, XCircle, Trash2 } from "lucide-react"

interface AdminRefreshButtonProps {
  className?: string
}

export function AdminRefreshButton({ className = "" }: AdminRefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [refreshStatus, setRefreshStatus] = useState<"idle" | "success" | "error">("idle")
  const [statusMessage, setStatusMessage] = useState("")

  const handleRefresh = async (clearCache = false) => {
    if (isRefreshing || isClearing) return

    if (clearCache) {
      setIsClearing(true)
      setRefreshStatus("idle")
      setStatusMessage("Clearing cache...")

      try {
        const response = await fetch("/api/clear-cache", {
          headers: {
            Authorization: `Bearer ${process.env.API_SECRET_KEY || "default-secret-key-change-me"}`,
          },
        })

        console.log("Response from cache clear--------------------------------->", response)

        if (!response.ok) {
          throw new Error("Failed to clear cache")
        }

        setStatusMessage("Cache cleared! Refreshing data...")
      } catch (error) {
        console.error("Error clearing cache:", error)
        setRefreshStatus("error")
        setStatusMessage("Failed to clear cache")
        setIsClearing(false)
        return
      }
    }

    setIsRefreshing(true)
    setRefreshStatus("idle")
    setStatusMessage(clearCache ? "Refreshing data..." : "Refreshing data...")

    try {
      const result = await forceDuneDataRefresh()

      if (result) {
        setRefreshStatus("success")
        setStatusMessage(clearCache ? "Cache cleared and data refreshed!" : "Data refreshed successfully!")
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
      setIsClearing(false)

      // Reset status after 5 seconds
      setTimeout(() => {
        setRefreshStatus("idle")
        setStatusMessage("")
      }, 5000)
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <DashcoinButton
        onClick={() => handleRefresh(false)}
        disabled={isRefreshing || isClearing}
        size="sm"
        className="flex items-center gap-1"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        <span className="no-underline" style={{ textShadow: "none" }}>
          {isRefreshing ? "Refreshing..." : "Refresh Data"}
        </span>
      </DashcoinButton>

      <DashcoinButton
        onClick={() => handleRefresh(true)}
        disabled={isRefreshing || isClearing}
        size="sm"
        variant="outline"
        className="flex items-center gap-1"
      >
        <Trash2 className="h-4 w-4" />
        <span className="no-underline" style={{ textShadow: "none" }}>
          {isClearing ? "Clearing..." : "Clear Cache"}
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
