"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface NavTabsProps {
  className?: string
}

export function NavTabs({ className }: NavTabsProps) {
  const pathname = usePathname()

  const tabs = [
    { name: "Overview", href: "/" },
    { name: "Project Deep Dives", href: "/deep-dives", comingSoon: true },
    { name: "Graphs", href: "/graphs", comingSoon: true },
  ]

  return (
    <div className={cn("flex justify-center", className)}>
      <div className="flex gap-4">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href))

          return (
            <div key={tab.name} className="relative flex flex-col items-center">
              <Link
                href={tab.comingSoon ? "#" : tab.href}
                className={cn(
                  "flex items-center justify-center h-12 w-40 text-base font-medium transition-colors rounded-lg border-2 border-dashBlack bg-dashYellow text-dashBlack",
                  isActive ? "bg-dashYellow-dark" : "hover:bg-dashYellow-dark",
                  tab.comingSoon && "opacity-90 cursor-not-allowed",
                )}
                style={{ fontFamily: "'Bangers', system-ui, sans-serif", letterSpacing: "1px" }}
                onClick={(e) => tab.comingSoon && e.preventDefault()}
              >
                <span className="px-2 truncate">{tab.name}</span>
              </Link>

              {tab.comingSoon && (
                <div className="mt-2 bg-transparent text-dashYellow-light text-xs font-bold py-1 px-3 rounded border border-dashYellow-light w-full text-center">
                  Coming Soon!
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
