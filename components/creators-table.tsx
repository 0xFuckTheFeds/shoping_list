import { DashcoinCard, DashcoinCardHeader, DashcoinCardTitle, DashcoinCardContent } from "@/components/ui/dashcoin-card"
import { formatCurrency } from "@/lib/utils"
import { Twitter } from "lucide-react"
import { CopyAddress } from "@/components/copy-address"

interface Creator {
  rank: number
  token: string
  symbol: string
  tokenAddress: string
  xHandle: string
  marketCap: number
  volume: number
  launchDate: string
}

interface CreatorsTableProps {
  creators: Creator[]
}

export function CreatorsTable({ creators }: CreatorsTableProps) {
  return (
    <DashcoinCard className="p-0 overflow-hidden">
      <DashcoinCardHeader className="p-6">
        <DashcoinCardTitle>Top Creators</DashcoinCardTitle>
      </DashcoinCardHeader>
      <DashcoinCardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-dashGreen-card dark:bg-dashGreen-cardDark border-b-2 border-dashBlack">
                <th className="text-left py-3 px-4 text-dashYellow">Rank</th>
                <th className="text-left py-3 px-4 text-dashYellow">Token</th>
                <th className="text-left py-3 px-4 text-dashYellow">Creator</th>
                <th className="text-left py-3 px-4 text-dashYellow">Market Cap</th>
                <th className="text-left py-3 px-4 text-dashYellow">Volume</th>
                <th className="text-left py-3 px-4 text-dashYellow">Launched</th>
              </tr>
            </thead>
            <tbody>
              {creators.map((creator) => (
                <tr
                  key={creator.rank}
                  className="border-b border-dashGreen-light hover:bg-dashGreen-card dark:hover:bg-dashGreen-cardDark"
                >
                  <td className="py-3 px-4">#{creator.rank}</td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-bold">{creator.symbol}</p>
                      <CopyAddress
                        address={creator.tokenAddress}
                        showBackground={false}
                        className="text-xs opacity-80 hover:opacity-100"
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <a
                      href={`https://x.com/${creator.xHandle.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-dashYellow hover:underline"
                    >
                      <Twitter className="h-4 w-4" />
                      {creator.xHandle}
                    </a>
                  </td>
                  <td className="py-3 px-4">{formatCurrency(creator.marketCap)}</td>
                  <td className="py-3 px-4">{formatCurrency(creator.volume)}</td>
                  <td className="py-3 px-4">{creator.launchDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashcoinCardContent>
    </DashcoinCard>
  )
}
