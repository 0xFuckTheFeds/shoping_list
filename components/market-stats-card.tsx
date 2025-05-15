interface MarketStatsCardProps {
  title: string
  value: number
  format: "currency" | "number" | "percent"
}

export function MarketStatsCard({ title, value, format }: MarketStatsCardProps) {
  // Format the value based on the format type
  const formattedValue = formatValue(value, format)

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-3xl font-bold">{formattedValue}</p>
    </div>
  )
}

function formatValue(value: number, format: "currency" | "number" | "percent"): string {
  if (format === "currency") {
    if (value >= 1_000_000_000) {
      return "$" + (value / 1_000_000_000).toFixed(2) + "B"
    }
    if (value >= 1_000_000) {
      return "$" + (value / 1_000_000).toFixed(2) + "M"
    }
    if (value >= 1_000) {
      return "$" + (value / 1_000).toFixed(2) + "K"
    }
    return "$" + value.toFixed(2)
  }

  if (format === "percent") {
    return value.toFixed(2) + "%"
  }

  // Default to number format
  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(2) + "B"
  }
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(2) + "M"
  }
  if (value >= 1_000) {
    return (value / 1_000).toFixed(2) + "K"
  }
  return value.toString()
}
