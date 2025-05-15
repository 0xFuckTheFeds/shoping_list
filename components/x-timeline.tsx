"use client"

import { useEffect } from "react"
import { DashcoinCard, DashcoinCardHeader, DashcoinCardTitle } from "@/components/ui/dashcoin-card"

interface XTimelineProps {
  username: string
  height?: number
  title?: string
}

export function XTimeline({ username, height = 600, title = "Latest Updates" }: XTimelineProps) {
  useEffect(() => {
    // Load Twitter/X widget script
    const script = document.createElement("script")
    script.src = "https://platform.twitter.com/widgets.js"
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return (
    <DashcoinCard>
      <DashcoinCardHeader>
        <DashcoinCardTitle>{title}</DashcoinCardTitle>
      </DashcoinCardHeader>
      <div className="mt-4">
        <a className="twitter-timeline" data-height={height} data-theme="dark" href={`https://twitter.com/${username}`}>
          Tweets by {username}
        </a>
      </div>
    </DashcoinCard>
  )
}
