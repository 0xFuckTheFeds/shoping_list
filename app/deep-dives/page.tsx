import { DashcoinLogo } from "@/components/dashcoin-logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { DashcoinCard } from "@/components/ui/dashcoin-card"
import { NavTabs } from "@/components/nav-tabs"
import Image from "next/image"

export default function DeepDivesPage() {
  return (
    <div className="min-h-screen">
      <header className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <DashcoinLogo size={56} />
          </div>
          <div>
            <ThemeToggle />
          </div>
        </div>
        <NavTabs />
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 md:w-32 md:h-32 relative mb-6">
            <Image
              src="/images/frog-soldier.png"
              alt="Dashcoin Frog Soldier"
              width={128}
              height={128}
              className="object-contain rounded-full overflow-hidden"
              style={{ clipPath: "circle(50%)" }}
            />
          </div>

          <h1 className="dashcoin-title text-4xl md:text-6xl text-dashYellow mb-4">Project Deep Dives</h1>
          <p className="text-xl max-w-2xl mx-auto mb-8">
            Detailed analysis of the top projects in the Believe ecosystem coming soon!
          </p>

          <DashcoinCard className="max-w-2xl p-8 text-center">
            <div className="dashcoin-text text-2xl text-dashYellow mb-4">🚧 Under Construction 🚧</div>
            <p className="mb-4">
              Our team is working hard to bring you in-depth analysis of the most exciting projects.
            </p>
            <p className="opacity-80">
              Check back soon for detailed reports, team interviews, and technical breakdowns.
            </p>
          </DashcoinCard>
        </div>
      </main>
    </div>
  )
}
