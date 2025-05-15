"use client"

import { useEffect, useRef } from "react"
import { DashcoinCard, DashcoinCardHeader, DashcoinCardTitle, DashcoinCardContent } from "@/components/ui/dashcoin-card"
import type { MarketCapTimeData } from "@/types/dune"
import { formatCurrency } from "@/lib/utils"
import { DuneQueryLink } from "@/components/dune-query-link"

// We'll use Chart.js for the charts
// This would normally be installed via npm, but for this example we'll load it from CDN
declare global {
  interface Window {
    Chart: any
  }
}

interface MarketCapChartProps {
  data: MarketCapTimeData[]
}

export function MarketCapChart({ data }: MarketCapChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<any>(null)

  const createChart = () => {
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current!.getContext("2d")
    if (!ctx) return

    // Sort data by date to ensure chronological order (oldest to newest)
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Prepare data for the chart
    const chartData = {
      labels: sortedData.map((item) => new Date(item.date).toLocaleDateString()),
      datasets: [
        {
          label: "Market Cap (USD)",
          data: sortedData.map((item) => item.marketcap),
          borderColor: "#ffd700",
          backgroundColor: "rgba(255, 215, 0, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
        {
          label: "Holders",
          data: sortedData.map((item) => item.num_holders),
          borderColor: "#66cc33",
          backgroundColor: "rgba(102, 204, 51, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          yAxisID: "y1",
        },
      ],
    }

    chartInstance.current = new window.Chart(ctx, {
      type: "line",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: {
              color: "rgba(42, 47, 14, 0.3)",
            },
            ticks: {
              color: "#fff0a0",
            },
          },
          y: {
            grid: {
              color: "rgba(42, 47, 14, 0.3)",
            },
            ticks: {
              color: "#fff0a0",
              callback: (value: number) => formatCurrency(value),
            },
          },
          y1: {
            position: "right",
            grid: {
              display: false,
            },
            ticks: {
              color: "#66cc33",
            },
          },
        },
        plugins: {
          legend: {
            labels: {
              color: "#fff0a0",
            },
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const label = context.dataset.label || ""
                const value = context.raw
                if (label === "Market Cap (USD)") {
                  return `${label}: ${formatCurrency(value)}`
                }
                return `${label}: ${value.toLocaleString()}`
              },
            },
          },
        },
      },
    })
  }

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

  return (
    <DashcoinCard>
      <DashcoinCardHeader>
        <DashcoinCardTitle>Market Cap & Holders Over Time</DashcoinCardTitle>
      </DashcoinCardHeader>
      <DashcoinCardContent>
        <div className="h-80">
          <canvas ref={chartRef} />
        </div>
        <DuneQueryLink queryId={5119241} className="mt-2" />
      </DashcoinCardContent>
    </DashcoinCard>
  )
}
