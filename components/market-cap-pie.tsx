"use client"

import { useEffect, useRef } from "react"
import { DashcoinCard, DashcoinCardHeader, DashcoinCardTitle, DashcoinCardContent } from "@/components/ui/dashcoin-card"
import type { TokenMarketCapData } from "@/types/dune"
import { formatCurrency } from "@/lib/utils"

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

  const createChart = () => {
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current!.getContext("2d")
    if (!ctx) return

    // Take top 10 tokens by market cap
    const topTokens = [...data].sort((a, b) => b.market_cap_usd - a.market_cap_usd).slice(0, 10)

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

    // Prepare data for the chart
    const chartData = {
      labels: topTokens.map((item) => item.symbol),
      datasets: [
        {
          data: topTokens.map((item) => item.market_cap_usd),
          backgroundColor: colors,
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
      </DashcoinCardContent>
    </DashcoinCard>
  )
}
