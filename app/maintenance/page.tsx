import { DashcoinLogo } from "@/components/dashcoin-logo"
import Image from "next/image"

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-dashGreen p-4 text-center">
      <div className="absolute top-4 right-4 opacity-30">
        <Image
          src="/images/frog-soldier.png"
          alt="Dashcoin Frog Soldier"
          width={100}
          height={100}
          className="object-contain"
        />
      </div>

      <DashcoinLogo size={80} className="mb-8" />

      <h1 className="dashcoin-title text-5xl text-dashYellow mb-6">Under Maintenance</h1>

      <div className="max-w-md mx-auto bg-dashGreen-dark p-6 rounded-lg border-2 border-dashBlack mb-8">
        <p className="text-xl text-dashYellow-light mb-4">
          We're currently updating our data sources to improve performance.
        </p>
        <p className="text-dashYellow-light opacity-80">Please check back soon. Thank you for your patience!</p>
      </div>

      <div className="animate-pulse">
        <div className="w-16 h-16 border-4 border-dashYellow border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-dashYellow-light mt-4">Working on it...</p>
      </div>

      <div className="absolute bottom-4 left-4 opacity-30">
        <Image
          src="/images/frog-soldier.png"
          alt="Dashcoin Frog Soldier"
          width={100}
          height={100}
          className="object-contain scale-x-[-1]"
        />
      </div>
    </div>
  )
}
