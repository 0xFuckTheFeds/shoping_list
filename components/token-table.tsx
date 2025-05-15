"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { DashcoinCard } from "@/components/ui/dashcoin-card"
import { ChevronDown, ChevronUp, Search, Loader2 } from "lucide-react"
import { fetchPaginatedTokens } from "@/app/actions/dune-actions"
import type { TokenData, PaginatedTokenResponse } from "@/types/dune"
import { CopyAddress } from "@/components/copy-address"

// Map of token symbols to their correct Axiom Trade pair addresses
const AXIOM_TRADE_PAIRS: Record<string, string> = {
  GOON: "C1gyx8um8GNk3HNZdvc9Sao6QwTdX23zh44LfTtPJaeJ", // SOL/GOONC pair
  // Add more pairs as needed
}

export default function TokenTable({ data }: { data: PaginatedTokenResponse | TokenData[] }) {
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

  // Fetch data when page, pageSize, sort field, or sort direction changes
  const fetchData = async () => {
    setIsLoading(true)
    try {
      const newData = await fetchPaginatedTokens(currentPage, itemsPerPage, sortField, sortDirection)
      setTokenData(newData)
    } catch (error) {
      console.error("Error fetching paginated tokens:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [currentPage, itemsPerPage, sortField, sortDirection])

  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
    // Reset to page 1 when sorting changes
    setCurrentPage(1)
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
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value))
              setCurrentPage(1) // Reset to first page when changing items per page
            }}
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
                <th
                  className="text-left py-3 px-4 text-dashYellow cursor-pointer"
                  onClick={() => handleSort("created_time")}
                >
                  <div className="flex items-center gap-1">Created {renderSortIndicator("created_time")}</div>
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
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center opacity-80">
                    {searchTerm
                      ? "No tokens found matching your search."
                      : "No token data available. Check your Dune query or API key."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DashcoinCard>

      {/* Pagination */}
      {tokenData.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
          <div className="text-sm opacity-80">
            Showing page {currentPage} of {tokenData.totalPages} ({tokenData.totalTokens} total tokens)
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1 || isLoading}
              className="px-3 py-1 bg-dashGreen-dark border border-dashBlack rounded-md text-dashYellow-light disabled:opacity-50"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || isLoading}
              className="px-3 py-1 bg-dashGreen-dark border border-dashBlack rounded-md text-dashYellow-light disabled:opacity-50"
            >
              Previous
            </button>

            {/* Page number buttons */}
            <div className="flex flex-wrap gap-1">
              {generatePageNumbers(currentPage, tokenData.totalPages).map((pageNum) =>
                pageNum === 0 ? (
                  <span key={`ellipsis-${pageNum}`} className="w-8 h-8 flex items-center justify-center">
                    ...
                  </span>
                ) : (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    disabled={isLoading}
                    className={`w-8 h-8 rounded-md ${
                      currentPage === pageNum
                        ? "bg-dashYellow text-dashBlack"
                        : "bg-dashGreen-dark border border-dashBlack text-dashYellow-light"
                    }`}
                  >
                    {pageNum}
                  </button>
                ),
              )}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(tokenData.totalPages, currentPage + 1))}
              disabled={currentPage === tokenData.totalPages || isLoading}
              className="px-3 py-1 bg-dashGreen-dark border border-dashBlack rounded-md text-dashYellow-light disabled:opacity-50"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(tokenData.totalPages)}
              disabled={currentPage === tokenData.totalPages || isLoading}
              className="px-3 py-1 bg-dashGreen-dark border border-dashBlack rounded-md text-dashYellow-light disabled:opacity-50"
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to generate page numbers for pagination
function generatePageNumbers(currentPage: number, totalPages: number): number[] {
  // If 7 or fewer pages, show all pages
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  // Always include first and last page
  const pages: number[] = []

  // Always show page 1
  pages.push(1)

  // If current page is close to the beginning
  if (currentPage <= 4) {
    pages.push(2, 3, 4, 5)
    pages.push(0) // Ellipsis placeholder
    pages.push(totalPages)
    return pages
  }

  // If current page is close to the end
  if (currentPage >= totalPages - 3) {
    pages.push(0) // Ellipsis placeholder
    pages.push(totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    return pages
  }

  // Current page is in the middle
  pages.push(0) // Ellipsis placeholder
  pages.push(currentPage - 1, currentPage, currentPage + 1)
  pages.push(0) // Ellipsis placeholder
  pages.push(totalPages)

  return pages
}
