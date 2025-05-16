import * as React from "react"
import { cn } from "@/lib/utils"

const DashcoinCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("card-with-border p-6 shadow-xl", className)} {...props} />
  ),
)
DashcoinCard.displayName = "DashcoinCard"

const DashcoinCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex space-y-1.5", className)} {...props} />,
)
DashcoinCardHeader.displayName = "DashcoinCardHeader"

const DashcoinCardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("dashcoin-text text-xl text-dashYellow", className)} {...props} />
  ),
)
DashcoinCardTitle.displayName = "DashcoinCardTitle"

const DashcoinCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("pt-4", className)} {...props} />,
)
DashcoinCardContent.displayName = "DashcoinCardContent"

const DashcoinCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex items-center pt-4", className)} {...props} />,
)
DashcoinCardFooter.displayName = "DashcoinCardFooter"

const DashcoinCacheStatus = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    lastUpdated: string
    nextUpdate: string
    hoursRemaining?: number
    minutesRemaining?: number
  }
>(({ className, lastUpdated, nextUpdate, hoursRemaining, minutesRemaining, ...props }, ref) => (
  <div ref={ref} className={cn("mt-2 pt-2 border-t border-dashGreen-light opacity-70 text-xs", className)} {...props}>
    <div className="flex flex-col gap-0.5">
      <p>Last updated: {lastUpdated}</p>
      {hoursRemaining !== undefined && minutesRemaining !== undefined ? (
        <p>
          Next update in: {hoursRemaining}h {minutesRemaining}m
        </p>
      ) : (
        <p>Next update: {nextUpdate}</p>
      )}
    </div>
  </div>
))
DashcoinCacheStatus.displayName = "DashcoinCacheStatus"

export {
  DashcoinCard,
  DashcoinCardHeader,
  DashcoinCardTitle,
  DashcoinCardContent,
  DashcoinCardFooter,
  DashcoinCacheStatus,
}
