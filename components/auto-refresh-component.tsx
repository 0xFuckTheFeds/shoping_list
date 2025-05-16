"use client"

import { useState, useEffect } from "react"
import { forceDuneDataRefresh } from "@/app/actions/dune-actions"

export function AutoRefreshComponent({ refreshInterval = 4 * 60 * 60 * 1000 }) {

  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const handleRefresh = async () => {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    
    try {
      console.log("Refreshing data...")
      await forceDuneDataRefresh()
    } catch (error) {
      console.error("Error refreshing data:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    handleRefresh()

    const intervalId = setInterval(() => {
      handleRefresh()
    }, refreshInterval)

    return () => clearInterval(intervalId)
  }, [refreshInterval])

  return null
}
