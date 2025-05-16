import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function formatNumber(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`
  } else if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`
  } else if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`
  } else {
    return value.toFixed(2)
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(currentValue: number, previousValue: number): number {
  if (previousValue === 0) return 0
  return ((currentValue - previousValue) / previousValue) * 100
}

/**
 * Format a date string to a locale date string
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (secondsAgo < 60) {
    return `${secondsAgo} second${secondsAgo === 1 ? '' : 's'} ago`
  }

  const minutesAgo = Math.floor(secondsAgo / 60)
  if (minutesAgo < 60) {
    return `${minutesAgo} minute${minutesAgo === 1 ? '' : 's'} ago`
  }

  const hoursAgo = Math.floor(minutesAgo / 60)
  if (hoursAgo < 24) {
    return `${hoursAgo} hour${hoursAgo === 1 ? '' : 's'} ago`
  }

  const daysAgo = Math.floor(hoursAgo / 24)
  if (daysAgo < 30) {
    return `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`
  }

  const monthsAgo = Math.floor(daysAgo / 30)
  if (monthsAgo < 12) {
    return `${monthsAgo} month${monthsAgo === 1 ? '' : 's'} ago`
  }

  const yearsAgo = Math.floor(monthsAgo / 12)
  return `${yearsAgo} year${yearsAgo === 1 ? '' : 's'} ago`
}