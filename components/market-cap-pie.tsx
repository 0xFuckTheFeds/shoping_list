"use client"

import { useEffect, useRef } from "react"
import { DashcoinCard, DashcoinCardHeader, DashcoinCardTitle, DashcoinCardContent } from "@/components/ui/dashcoin-card"
import type { TokenMarketCapData } from "@/types/dune"
import { formatCurrency } from "@/lib/utils"
import { DuneQueryLink } from "@/components/dune-query-link"

interface MarketCapPieProps {
  data: TokenMarketCapData[]
}

export function MarketCapPie({ data }: MarketCapPieProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<any>(null)

  useEffect(() => {
    // Load Chart.js from CDN
    const script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/npm/chart.js"
    script.async = true
    script.onload = () => {
      if (chartRef.current && data.length > 0) {
        createChart()
      }
    }
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [])

  useEffect(() => {
    if (window.Chart && chartRef.current && data.length > 0) {
      createChart()
    }
  }, [data])

  // Add defensive programming to handle potential null or undefined values

  // Update the createChart function to handle potential null or undefined values
  const createChart = () => {
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current?.getContext("2d")
    if (!ctx || !data || data.length === 0) return

    // Take top 10 tokens by market cap with null checks
    const topTokens = [...data]
      .filter((token) => token && token.market_cap_usd !== undefined)
      .sort((a, b) => (b.market_cap_usd || 0) - (a.market_cap_usd || 0))
      .slice(0, 10)

    // If no tokens with market cap, return
    if (topTokens.length === 0) return

    // Generate colors for each token
    const colors = [
      "#ffd700", // dashYellow
      "#66cc33", // dashGreen
      "#ff6666", // dashRed
      "#0077cc", // dashBlue-light
      "#99dd66", // dashGreen-light
      "#e6b800", // dashYellow-dark
      "#339900", // dashGreen-dark
      "#ff9999", // lighter red
      "#00aaff", // dashBlue-grid
      "#cccccc", // gray
    ]

    // Prepare data for the chart with null checks
    const chartData = {
      labels: topTokens.map((item) => item.symbol || "Unknown"),
      datasets: [
        {
          data: topTokens.map((item) => item.market_cap_usd || 0),
          backgroundColor: colors.slice(0, topTokens.length),
          borderColor: "#222222",
          borderWidth: 2,
        },
      ],
    }

    chartInstance.current = new window.Chart(ctx, {
      type: "pie",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: {
              color: "#fff0a0",
              font: {
                size: 12,
              },
            },
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const label = context.label || ""
                const value = context.raw
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
                const percentage = ((value / total) * 100).toFixed(2)
                return `${label}: ${formatCurrency(value)} (${percentage}%)`
              },
            },
          },
        },
      },
    })
  }

  return (
    <DashcoinCard>
      <DashcoinCardHeader>
        <DashcoinCardTitle>Market Cap Distribution</DashcoinCardTitle>
      </DashcoinCardHeader>
      <DashcoinCardContent>
        <div className="h-80">
          <canvas ref={chartRef} />
        </div>
        <DuneQueryLink queryId={5140151} className="mt-2" />
      </DashcoinCardContent>
    </DashcoinCard>
  )
}
