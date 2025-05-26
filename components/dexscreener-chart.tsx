"use client"

import { useEffect, useState } from "react"
import { DashcoinCard, DashcoinCardHeader, DashcoinCardTitle } from "@/components/ui/dashcoin-card"

interface DexscreenerChartProps {
  tokenAddress: string
  title?: string
  onDataLoaded?: (data: any) => void
}

export function DexscreenerChart({ tokenAddress = "", title = "Price Chart", onDataLoaded }: DexscreenerChartProps) {
  const [isClient, setIsClient] = useState(false)

  const safeTokenAddress = typeof tokenAddress === "string" ? tokenAddress : String(tokenAddress || "")

  useEffect(() => {
    setIsClient(true)

    const handleMessage = (event: MessageEvent) => {
      if (event.origin && event.origin.includes("dexscreener.com")) {
        try {
          if (event.data && event.data.pair) {
            if (onDataLoaded) {
              onDataLoaded(event.data.pair)
            }
          }
        } catch (error) {
          console.error("Error processing Dexscreener message:", error)
        }
      }
    }

    window.addEventListener("message", handleMessage)

    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [onDataLoaded])

  if (!safeTokenAddress) {
    return (
      <DashcoinCard className="h-80 flex items-center justify-center">
        <p className="opacity-80">No token address provided for chart</p>
      </DashcoinCard>
    )
  }

  if (!isClient) {
    return (
      <DashcoinCard className="h-80 flex items-center justify-center">
        <p className="opacity-80">Loading chart...</p>
      </DashcoinCard>
    )
  }

  return (
    <DashcoinCard className="overflow-hidden">
      <DashcoinCardHeader>
        <DashcoinCardTitle>{title}</DashcoinCardTitle>
      </DashcoinCardHeader>
      <div className="mt-2">
        <style jsx>{`
          #dexscreener-embed {
            position: relative;
            width: 100%;
            padding-bottom: 125%;
          }
          @media (min-width: 1400px) {
            #dexscreener-embed {
              padding-bottom: 65%;
            }
          }
          #dexscreener-embed iframe {
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            border: 0;
          }
        `}</style>
        <div id="dexscreener-embed">
          <iframe
            src={`https://dexscreener.com/solana/${safeTokenAddress}?embed=1&loadChartSettings=0&chartLeftToolbar=0&chartTheme=dark&theme=dark&chartStyle=0&chartType=usd&interval=15`}
            title="DEX Screener Chart"
          />
        </div>
      </div>
    </DashcoinCard>
  )
}
