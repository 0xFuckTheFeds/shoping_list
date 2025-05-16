import { ExternalLink } from "lucide-react"
import Link from "next/link"

interface DuneQueryLinkProps {
  queryId: number
  className?: string
}

export function DuneQueryLink({ queryId, className = "" }: DuneQueryLinkProps) {
  const duneUrl = `https://dune.com/queries/${queryId}/resutls`

  return (
    <Link
      href={duneUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-xs flex items-center gap-1 text-dashYellow-light/70 hover:text-dashYellow transition-colors ${className}`}
    >
      <ExternalLink className="h-3 w-3" />
      <span>Dune Query #{queryId}</span>
    </Link>
  )
}
