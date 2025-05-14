import * as React from "react"
import { cn } from "@/lib/utils"

const DashcoinCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("card-with-border p-6 shadow-xl", className)} {...props} />
  ),
)
DashcoinCard.displayName = "DashcoinCard"

const DashcoinCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex flex-col space-y-1.5", className)} {...props} />,
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

export { DashcoinCard, DashcoinCardHeader, DashcoinCardTitle, DashcoinCardContent, DashcoinCardFooter }
