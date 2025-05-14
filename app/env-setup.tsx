"use client"

import type React from "react"
import { useState } from "react"
import { DashcoinButton } from "@/components/ui/dashcoin-button"
import { DashcoinLogo } from "@/components/dashcoin-logo"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DashcoinCard,
  DashcoinCardHeader,
  DashcoinCardTitle,
  DashcoinCardContent,
  DashcoinCardFooter,
} from "@/components/ui/dashcoin-card"

export default function EnvSetup() {
  const [apiKey, setApiKey] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // In a real app, you would save this to your environment variables
    // This is just a mock implementation
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsSubmitting(false)
    setIsSuccess(true)

    // Reload the page after 2 seconds to simulate the environment variable being set
    setTimeout(() => {
      window.location.reload()
    }, 2000)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="mb-8">
        <DashcoinLogo size={64} />
      </div>

      <DashcoinCard className="w-full max-w-md">
        <DashcoinCardHeader>
          <DashcoinCardTitle>Dune API Setup</DashcoinCardTitle>
          <p className="text-sm mt-2 opacity-80">Enter your Dune API key to connect to your queries</p>
        </DashcoinCardHeader>

        <form onSubmit={handleSubmit}>
          <DashcoinCardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="api-key" className="text-sm font-medium">
                  Dune API Key
                </label>
                <input
                  id="api-key"
                  type="password"
                  placeholder="Enter your Dune API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-dashGreen-dark border border-dashBlack rounded-md text-dashYellow-light placeholder:text-dashYellow-light/50 focus:outline-none focus:ring-2 focus:ring-dashYellow"
                />
              </div>
              <p className="text-xs opacity-80">
                You can find your API key in your Dune account settings.
                <a
                  href="https://dune.com/settings/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-dashYellow hover:underline ml-1"
                >
                  Go to Dune settings
                </a>
              </p>
            </div>
          </DashcoinCardContent>

          <DashcoinCardFooter>
            <DashcoinButton type="submit" className="w-full" disabled={isSubmitting || isSuccess}>
              {isSubmitting ? "Connecting..." : isSuccess ? "Connected!" : "Connect to Dune"}
            </DashcoinButton>
          </DashcoinCardFooter>
        </form>
      </DashcoinCard>
    </div>
  )
}
