"use client"

import type React from "react"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CopyAddressProps {
  address: string
  truncate?: boolean
  displayLength?: number
  className?: string
  iconClassName?: string
  showIcon?: boolean
  showBackground?: boolean
}

export function CopyAddress({
  address = "",
  truncate = true,
  displayLength = 6,
  className = "",
  iconClassName = "",
  showIcon = true,
  showBackground = false,
}: CopyAddressProps) {
  const [copied, setCopied] = useState(false)

  // Ensure address is a string
  const safeAddress = typeof address === "string" ? address : String(address || "")

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(safeAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  // Format address for display
  const displayAddress =
    truncate && safeAddress.length > displayLength * 2
      ? `${safeAddress.substring(0, displayLength)}...${safeAddress.substring(safeAddress.length - 4)}`
      : safeAddress

  return (
    <div
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1 cursor-pointer font-mono text-xs",
        showBackground && "px-2 py-1 rounded-md hover:bg-dashGreen-dark",
        className,
      )}
      title={safeAddress}
    >
      <span className="truncate">{displayAddress}</span>
      {showIcon && (
        <span className={cn("text-dashYellow-light opacity-70 hover:opacity-100", iconClassName)}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </span>
      )}
    </div>
  )
}
