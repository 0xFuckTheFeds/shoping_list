import * as React from "react"
import { cn } from "@/lib/utils"

interface DashcoinButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline"
  size?: "sm" | "md" | "lg"
  asChild?: boolean
}

const DashcoinButton = React.forwardRef<HTMLButtonElement, DashcoinButtonProps>(
  ({ className, variant = "primary", size = "md", asChild = false, ...props }, ref) => {
    const Comp = asChild ? React.Fragment : "button"
    return (
      <Comp
        className={cn(
          "relative inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 dashcoin-text",
          {
            "bg-dashYellow text-dashBlack border-2 border-dashBlack hover:bg-dashYellow-dark": variant === "primary",
            "bg-dashGreen-accent text-white border-2 border-dashBlack hover:bg-dashGreen-light":
              variant === "secondary",
            "bg-transparent border-2 border-dashYellow text-dashYellow hover:bg-dashGreen-dark": variant === "outline",
            "text-sm px-3 py-1 rounded-md shadow-[2px_2px_0_0_#222222]": size === "sm",
            "text-base px-4 py-2 rounded-lg shadow-[3px_3px_0_0_#222222]": size === "md",
            "text-lg px-6 py-3 rounded-xl shadow-[4px_4px_0_0_#222222]": size === "lg",
          },
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
DashcoinButton.displayName = "DashcoinButton"

export { DashcoinButton }
