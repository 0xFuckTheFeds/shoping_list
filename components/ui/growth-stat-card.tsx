"use client"

import { useEffect, useRef, useState } from "react"
import { TrendingUp, Target, Zap } from 'lucide-react'
import { DashcoinCard } from "@/components/ui/dashcoin-card" // Base card component

interface GrowthStatCardProps {
  value: string
  label?: string
  className?: string
}

export function GrowthStatCard({ value, label = "since launch", className = "" }: GrowthStatCardProps) {
  // Intersection Observer for entrance animation
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )
    
    if (cardRef.current) {
      observer.observe(cardRef.current)
    }
    
    return () => observer.disconnect()
  }, [])

  return (
    <DashcoinCard
      ref={cardRef}
      className={`relative overflow-hidden border-2 border-dashBlack ${className} ${
        isVisible ? "animate-appear" : "opacity-0"
      }`}
    >
      {/* Military-style background with trench pattern */}
      <div className="absolute inset-0 bg-dashGreen-card opacity-90">
        {/* Tactical grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#222_1px,transparent_1px)] bg-[size:8px_8px] opacity-20"></div>
        
        {/* Scanning line effect */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.1)_25%,rgba(0,0,0,0.1)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.1)_75%)] bg-[size:8px_8px] opacity-10 animate-tactical-scan"></div>
      </div>

      {/* Bullet hole effects - randomly positioned */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-dashBlack"
          style={{
            top: `${10 + Math.random() * 80}%`,
            left: `${10 + Math.random() * 80}%`,
            boxShadow: "0 0 0 1px rgba(255,215,0,0.5)",
            transform: "rotate(45deg)",
          }}
        >
          <div className="absolute inset-0 border border-dashYellow-dark rounded-full transform scale-150 opacity-50"></div>
        </div>
      ))}

      {/* Main content with military icons */}
      <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center">
        {/* Icons: Target/crosshair and trending up */}
        <div className="flex items-center justify-center mb-2 gap-2">
          <div className="relative">
            <Target className="h-8 w-8 text-dashYellow animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1 h-1 bg-dashRed rounded-full"></div>
            </div>
          </div>
          <TrendingUp className="h-7 w-7 text-dashYellow" />
        </div>

        {/* Main value with lightning bolt alert */}
        <div className="dashcoin-text text-4xl font-bold text-dashYellow animate-tactical-pulse relative">
          {value}
          <Zap className="absolute -right-6 -top-2 h-5 w-5 text-dashYellow animate-tactical-flash" />
        </div>

        {/* Label with blinking indicator lights */}
        <div className="mt-2 text-lg text-dashYellow-light flex items-center gap-2">
          <div className="w-2 h-2 bg-dashYellow rounded-full animate-tactical-blink"></div>
          <span className="dashcoin-text">{label}</span>
          <div
            className="w-2 h-2 bg-dashYellow rounded-full animate-tactical-blink"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>
      </div>

      {/* Military stencil border */}
      <div className="absolute inset-0 border-2 border-dashed border-dashYellow opacity-30"></div>

      {/* Corner tactical markers */}
      <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-dashYellow"></div>
      <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-dashYellow"></div>
      <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-dashYellow"></div>
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-dashYellow"></div>
    </DashcoinCard>
  )
} 