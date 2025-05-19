"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { DashcoinCard } from "@/components/ui/dashcoin-card"
import { ChevronDown, ChevronUp, Search, Loader2, FileSearch } from "lucide-react"
import { fetchPaginatedTokens } from "@/app/actions/dune-actions"
import type { TokenData, PaginatedTokenResponse } from "@/types/dune"
import { CopyAddress } from "@/components/copy-address"
import { DuneQueryLink } from "@/components/dune-query-link"

interface ResearchScoreData {
  symbol: string
  score: number | null
  [key: string]: any 
}

async function fetchTokenResearch(): Promise<ResearchScoreData[]> {
  const API_KEY = 'AIzaSyC8QxJez_UTHUJS7vFj1J3Sje0CWS9tXyk';
  const SHEET_ID = '1Nra5QH-JFAsDaTYSyu-KocjbkZ0MATzJ4R-rUt-gLe0';
  const SHEET_NAME = 'Dashcoin Scoring';
  const RANGE = `${SHEET_NAME}!A1:K29`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.values || data.values.length < 2) {
      console.warn('No data found in Google Sheet');
      return [];
    }

    const [header, ...rows] = data.values;
    
    const structured = rows.map((row: any) => {
      const entry: Record<string, any> = {};
      header.forEach((key: string, i: number) => {
        entry[key.trim()] = row[i] || '';
      });
      return entry;
    });

    return structured.map((entry: any) => {
      return {
        symbol: (entry['Project'] || '').toString().toUpperCase(),
        score: entry['Score'] ? parseFloat(entry['Score']) : null,
      };
    });
  } catch (err) {
    console.error('Google Sheets API error:', err);
    return [];
  }
}

export default function TokenTable({ data }: { data: PaginatedTokenResponse | TokenData[] }) {
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
  const [researchScores, setResearchScores] = useState<ResearchScoreData[]>([])
  const [isLoadingResearch, setIsLoadingResearch] = useState(false)
  const [isSortingLocally, setIsSortingLocally] = useState(false)

  useEffect(() => {
    const getResearchScores = async () => {
      setIsLoadingResearch(true);
      try {
        const scores = await fetchTokenResearch();
        setResearchScores(scores);
      } catch (error) {
        console.error("Error fetching research scores:", error);
      } finally {
        setIsLoadingResearch(false);
      }
    };
    
    getResearchScores();
  }, []);

  useEffect(() => {
    if (!Array.isArray(tokenData.tokens)) {
      setFilteredTokens([])
      return
    }

    if (searchTerm.trim() === "") {
      setFilteredTokens(tokenData.tokens)
      return
    }

    const filtered = tokenData.tokens.filter((token: any) => {
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

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const newData = await fetchPaginatedTokens(
        currentPage, 
        itemsPerPage, 
        sortField, 
        sortDirection,
        searchTerm 
      );
      setTokenData(newData);
      setFilteredTokens(newData.tokens || []);
    } catch (error) {
      console.error("Error fetching paginated tokens:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      const timer = setTimeout(() => {
        fetchData();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [searchTerm]);

  useEffect(() => {
    // Only fetch from API for specific sort fields that are handled server-side
    if (["researchScore", "name", "symbol"].includes(sortField) || isSortingLocally) {
      sortTokensLocally();
    } else {
      fetchData();
    }
  }, [currentPage, itemsPerPage, sortField, sortDirection, isSortingLocally]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    
    // Set flag for fields that need local sorting
    setIsSortingLocally(["researchScore", "name", "created_time", "symbol"].includes(field));
    
    setCurrentPage(1);
  }

  const sortTokensLocally = () => {
    if (!filteredTokens.length) return;
    
    const sortedTokens = [...filteredTokens].sort((a, b) => {
      let valueA, valueB;
      
      switch(sortField) {
        case "name":
          valueA = (a.name || "").toString().toLowerCase();
          valueB = (b.name || "").toString().toLowerCase();
          return sortDirection === "asc" 
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
            
        case "symbol":
          valueA = (a.symbol || "").toString().toLowerCase();
          valueB = (b.symbol || "").toString().toLowerCase();
          return sortDirection === "asc" 
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
            
        case "created_time":
          valueA = a.created_time ? new Date(a.created_time).getTime() : 0;
          valueB = b.created_time ? new Date(b.created_time).getTime() : 0;
          return sortDirection === "asc" 
            ? valueA - valueB
            : valueB - valueA;
            
        case "researchScore":
          const scoreA = getResearchScore(a.symbol || '');
          const scoreB = getResearchScore(b.symbol || '');
          
          if (scoreA === null && scoreB === null) return 0;
          if (scoreA === null) return sortDirection === "asc" ? -1 : 1;
          if (scoreB === null) return sortDirection === "asc" ? 1 : -1;
          
          return sortDirection === "asc" 
            ? scoreA - scoreB 
            : scoreB - scoreA;
            
        default:
          return 0;
      }
    });
    
    setFilteredTokens(sortedTokens);
  };

  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
  }

  const getTokenProperty = (token: any, property: string, defaultValue: any = "N/A") => {
    return token && token[property] !== undefined && token[property] !== null ? token[property] : defaultValue
  }

  const getResearchScore = (tokenSymbol: string): number | null => {
    if (!tokenSymbol) return null;
    
    const normalizedSymbol = tokenSymbol.toUpperCase();
    const scoreData = researchScores.find(item => item.symbol.toUpperCase() === normalizedSymbol);
    return scoreData?.score || null;
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
            <option value="name">Name</option>
            <option value="symbol">Token</option>
            <option value="researchScore">Research Score</option>
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
              setCurrentPage(1)
            }}
            className="px-3 py-2 bg-dashGreen-dark border border-dashBlack rounded-md text-dashYellow-light focus:outline-none focus:ring-2 focus:ring-dashYellow"
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
      </div>

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
                <th 
                  className="text-left py-3 px-4 text-dashYellow cursor-pointer"
                  onClick={() => handleSort("researchScore")}
                >
                  <div className="flex items-center gap-1">
                    Research Score {renderSortIndicator("researchScore")}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-dashYellow" />
                      <span>Loading tokens...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTokens.length > 0 ? (
                filteredTokens.map((token: any , index: number) => {
                  const tokenAddress = getTokenProperty(token, "token", "")
                  const tokenSymbol = getTokenProperty(token, "symbol", "???")
                  const researchScore = getResearchScore(tokenSymbol)

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
                            href={tokenAddress ? `https://axiom.trade/t/${tokenAddress}/dashc` : "#"}
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
                        {isLoadingResearch ? (
                          <div className="flex items-center">
                            <Loader2 className="h-4 w-4 animate-spin text-dashYellow mr-2" />
                            <span>Loading...</span>
                          </div>
                        ) : researchScore !== null ? (
                          <div className="flex items-center">
                            <span className="font-medium mr-2">{researchScore.toFixed(1)}</span>
                            <Link href={`/tokendetail/${tokenSymbol}`} className="hover:text-dashYellow">
                              <FileSearch className="h-4 w-4" />
                            </Link>
                          </div>
                        ) : (
                          <span className="text-dashYellow-light opacity-50">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center opacity-80">
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

      {/* Dune Query Link */}
      <div className="flex justify-end mt-2">
        <DuneQueryLink queryId={5140151} />
      </div>

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

function generatePageNumbers(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: number[] = []

  pages.push(1)

  if (currentPage <= 4) {
    pages.push(2, 3, 4, 5)
    pages.push(0) 
    pages.push(totalPages)
    return pages
  }

  if (currentPage >= totalPages - 3) {
    pages.push(0) 
    pages.push(totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    return pages
  }

  pages.push(0) 
  pages.push(currentPage - 1, currentPage, currentPage + 1)
  pages.push(0) 
  pages.push(totalPages)

  return pages
}