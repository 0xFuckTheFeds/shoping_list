"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { DashcoinCard } from "@/components/ui/dashcoin-card"
import { ChevronDown, ChevronUp, Search, Loader2 } from "lucide-react"
import type { PaginatedTokenResponse } from "@/types/dune"
import { CopyAddress } from "@/components/copy-address"
import type { TokenData } from "@/types/dune"

// Map of token symbols to their correct Axiom Trade pair addresses
const AXIOM_TRADE_PAIRS: Record<string, string> = {
  GOON: "C1gyx8um8GNk3HNZdvc9Sao6QwTdX23zh44LfTtPJaeJ", // SOL/GOONC pair
  // Add more pairs as needed
}

interface TokenTableProps {
  tokens: TokenData[]
}

function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(2) + "B"
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + "M"
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(2) + "K"
  }
  return num.toString()
}

export function TokenTable({ data }: { data: PaginatedTokenResponse | TokenData[] }) {
  // Convert legacy data format to new format if needed
  const initialData = Array.isArray(data)
    ? { tokens: data, page: 1, pageSize: 10, totalTokens: data.length, totalPages: Math.ceil(data.length / 10) }
    : data

  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState("marketCap")
  const [sortDirection, setSortDirection] = useState("desc")
  const [currentPage, setCurrentPage] = useState(initialData.page || 1)
  const [itemsPerPage, setItemsPerPage] = useState(initialData.pageSize || 10)
  const [isLoading, setIsLoading] = useState(false)
  const [tokenData, setTokenData] = useState<PaginatedTokenResponse>(initialData)
  const [filteredTokens, setFilteredTokens] = useState<TokenData[]>(initialData.tokens || [])

  // Filter tokens based on search term
  useEffect(() => {
    if (!Array.isArray(tokenData.tokens)) {
      setFilteredTokens([])
      return
    }

    if (searchTerm.trim() === "") {
      setFilteredTokens(tokenData.tokens)
      return
    }

    const filtered = tokenData.tokens.filter((token) => {
      const symbolMatch =
        token.symbol && typeof token.symbol === "string"
          ? token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
          : false

      const nameMatch =
        token.name && typeof token.name === "string"
          ? token.name.toLowerCase().includes(searchTerm.toLowerCase())
          : false

      const descriptionMatch =
        token.description && typeof token.description === "string"
          ? token.description.toLowerCase().includes(searchTerm.toLowerCase())
          : false

      return symbolMatch || nameMatch || descriptionMatch
    })

    setFilteredTokens(filtered)
  }, [searchTerm, tokenData.tokens])

  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  // Render sort indicator
  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
  }

  // Safe getter for token properties
  const getTokenProperty = (token: any, property: string, defaultValue: any = "N/A") => {
    return token && token[property] !== undefined && token[property] !== null ? token[property] : defaultValue
  }

  // Get the correct Axiom Trade link for a token
  const getAxiomTradeLink = (token: TokenData) => {
    const tokenSymbol = getTokenProperty(token, "symbol", "")
    const tokenAddress = getTokenProperty(token, "token", "")

    // If we have a specific pair address for this token, use it
    if (tokenSymbol && AXIOM_TRADE_PAIRS[tokenSymbol]) {
      return `https://axiom.trade/meme/${AXIOM_TRADE_PAIRS[tokenSymbol]}`
    }

    // Otherwise use the token address
    return tokenAddress ? `https://axiom.trade/meme/${tokenAddress}/@dashc` : "#"
  }

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dashYellow-light opacity-70" />
          <input
            type="text"
            placeholder="Search tokens..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dashGreen-dark border border-dashBlack rounded-md text-dashYellow-light placeholder:text-dashYellow-light/50 focus:outline-none focus:ring-2 focus:ring-dashYellow"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={sortField}
            onChange={(e) => handleSort(e.target.value)}
            className="px-3 py-2 bg-dashGreen-dark border border-dashBlack rounded-md text-dashYellow-light focus:outline-none focus:ring-2 focus:ring-dashYellow"
          >
            <option value="marketCap">Market Cap</option>
            <option value="num_holders">Holders</option>
            <option value="created_time">Created Date</option>
            <option value="first_trade_time">First Trade</option>
            <option value="vol_usd">Volume</option>
          </select>
          <select
            value={sortDirection}
            onChange={(e) => setSortDirection(e.target.value as "asc" | "desc")}
            className="px-3 py-2 bg-dashGreen-dark border border-dashBlack rounded-md text-dashYellow-light focus:outline-none focus:ring-2 focus:ring-dashYellow"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="px-3 py-2 bg-dashGreen-dark border border-dashBlack rounded-md text-dashYellow-light focus:outline-none focus:ring-2 focus:ring-dashYellow"
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
      </div>

      {/* Token table */}
      <DashcoinCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-dashGreen-card dark:bg-dashGreen-cardDark border-b-2 border-dashBlack">
                <th className="text-left py-3 px-4 text-dashYellow cursor-pointer" onClick={() => handleSort("symbol")}>
                  <div className="flex items-center gap-1">Token {renderSortIndicator("symbol")}</div>
                </th>
                <th className="text-left py-3 px-4 text-dashYellow">Actions</th>
                <th className="text-left py-3 px-4 text-dashYellow cursor-pointer" onClick={() => handleSort("name")}>
                  <div className="flex items-center gap-1">Name {renderSortIndicator("name")}</div>
                </th>
                <th
                  className="text-left py-3 px-4 text-dashYellow cursor-pointer"
                  onClick={() => handleSort("marketCap")}
                >
                  <div className="flex items-center gap-1">Market Cap {renderSortIndicator("marketCap")}</div>
                </th>
                <th
                  className="text-left py-3 px-4 text-dashYellow cursor-pointer"
                  onClick={() => handleSort("num_holders")}
                >
                  <div className="flex items-center gap-1">Holders {renderSortIndicator("num_holders")}</div>
                </th>
                <th className="text-left py-3 px-4 text-dashYellow">Created</th>
                <th
                  className="text-left py-3 px-4 text-dashYellow cursor-pointer"
                  onClick={() => handleSort("first_trade_time")}
                >
                  <div className="flex items-center gap-1">First Trade {renderSortIndicator("first_trade_time")}</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-dashYellow" />
                      <span>Loading tokens...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTokens.length > 0 ? (
                filteredTokens.map((token, index) => {
                  const tokenAddress = getTokenProperty(token, "token", "")
                  const tokenSymbol = getTokenProperty(token, "symbol", "???")
                  const axiomTradeLink = getAxiomTradeLink(token)

                  return (
                    <tr
                      key={index}
                      className="border-b border-dashGreen-light hover:bg-dashGreen-card dark:hover:bg-dashGreen-cardDark"
                    >
                      <td className="py-3 px-4">
                        <Link href={`/token/${tokenSymbol}`} className="hover:text-dashYellow">
                          <div>
                            <p className="font-bold">{tokenSymbol}</p>
                            {tokenAddress && (
                              <CopyAddress
                                address={tokenAddress}
                                showBackground={false}
                                className="text-xs opacity-80 hover:opacity-100"
                              />
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <a
                            href={axiomTradeLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-dashYellow text-dashBlack font-medium rounded-md hover:bg-dashYellow-dark transition-colors text-sm flex items-center justify-center min-w-[80px] border border-dashBlack"
                          >
                            TRADE
                          </a>
                        </div>
                      </td>
                      <td className="py-3 px-4">{getTokenProperty(token, "name")}</td>
                      <td className="py-3 px-4">{formatCurrency(getTokenProperty(token, "marketCap", 0))}</td>
                      <td className="py-3 px-4">{getTokenProperty(token, "num_holders", 0).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        {token && token.created_time ? new Date(token.created_time).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        {token && token.first_trade_time
                          ? new Date(token.first_trade_time).toLocaleDateString()
                          : "N/A"}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center opacity-80">
                    No token data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DashcoinCard>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || isLoading}
          className="px-3 py-1 bg-dashGreen-dark border border-dashBlack rounded-md text-dashYellow-light disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm opacity-80">
          Page {currentPage} of {initialData.totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(Math.min(initialData.totalPages, currentPage + 1))}
          disabled={currentPage === initialData.totalPages || isLoading}
          className="px-3 py-1 bg-dashGreen-dark border border-dashBlack rounded-md text-dashYellow-light disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}
