// app/compare/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { DashcoinCard, DashcoinCardContent, DashcoinCardHeader, DashcoinCardTitle } from "@/components/ui/dashcoin-card";
import { Button } from "@/components/ui/button";
import { Twitter, BarChart2, PieChart, ArrowRight, InfoIcon, Loader2 } from "lucide-react";
import { DashcoinLogo } from "@/components/dashcoin-logo";

// Since this is a client component, we need to manually import these
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsePieChart, Pie, Cell } from 'recharts';

interface TokenData {
  token: string;          // Address
  name: string;
  symbol: string;
  marketCap: number;      // market_cap_usd from the fetch function
  num_holders: number;    // Using num_holders from the fetch function
  volume24h: number;      // vol_usd from the fetch function
  first_trade_time: string; // Using this as launch date
  marketcapgrowthperday: number; // Will calculate this
}

interface ComparisonTokenData {
  address: string;
  name: string;
  symbol: string;
  marketCap: number;
  holders: number;
  volume24h: number;
  launchDate: string;
  marketcapgrowthperday: number;
}

export default function ComparePage() {
  // Dashcoin trade link (used for navbar)
  const dashcoinTradeLink = "https://axiom.trade/t/fRfKGCriduzDwSudCwpL7ySCEiboNuryhZDVJtr1a1C/dashc";
  // Dashcoin X (Twitter) link
  const dashcoinXLink = "https://x.com/dune_dashcoin";

  const [token1Address, setToken1Address] = useState("");
  const [token2Address, setToken2Address] = useState("");
  const [token1Name, setToken1Name] = useState("");
  const [token2Name, setToken2Name] = useState("");
  const [isComparing, setIsComparing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [allTokens, setAllTokens] = useState<TokenData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [comparisonData, setComparisonData] = useState<{token1: ComparisonTokenData | null, token2: ComparisonTokenData | null}>({
    token1: null,
    token2: null
  });

  // Mock data for fallback if fetch fails
  const mockComparisonData = {
    token1: {
      address: "7gkgsqE2Uip7LUyrqEi8fyLPNSbn7GYu9yFgtxZwYUVa",
      name: "Dashcoin",
      symbol: "DASHC",
      marketCap: 42500000,
      holders: 12850,
      volume24h: 3200000,
      launchDate: "2024-02-15",
      marketcapgrowthperday: 15646000
    },
    token2: {
      address: "8JUjWjGgT5DNhfxRm9ZdQbVGPeYvKgxkQzeQN9QNBGz7",
      name: "Sample Token",
      symbol: "SMPL",
      marketCap: 12000000,
      holders: 5420,
      volume24h: 950000,
      launchDate: "2024-04-01",
      marketcapgrowthperday: 3243000
    }
  };

  // Fetch all tokens on component mount
  useEffect(() => {
    async function fetchTokens() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/tokens');
        if (!response.ok) {
          throw new Error('Failed to fetch tokens');
        }
        const tokens = await response.json();
        setAllTokens(tokens);
        setError(null);
      } catch (err) {
        console.error('Error fetching tokens:', err);
        setError('Failed to load token data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTokens();
  }, []);

  // Calculate marketcap growth per day
  const calculateMarketCapGrowthPerDay = (marketCap: number, launchDate: string): number => {
    const creationDate = new Date(launchDate);
    const today = new Date();
    const differenceInTime = today.getTime() - creationDate.getTime();
    const differenceInDays = Math.max(1, Math.floor(differenceInTime / (1000 * 3600 * 24)));
    return marketCap / differenceInDays;
  };

  // Convert TokenData to ComparisonTokenData
  const convertTokenData = (token: TokenData): ComparisonTokenData => {
    const marketcapgrowthperday = calculateMarketCapGrowthPerDay(token.marketCap, token.first_trade_time);
    
    return {
      address: token.token,
      name: token.name,
      symbol: token.symbol,
      marketCap: token.marketCap,
      holders: token.num_holders,
      volume24h: token.volume24h,
      launchDate: token.first_trade_time,
      marketcapgrowthperday
    };
  };

  // Function to handle comparison
  const handleCompare = () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Find tokens by name (case insensitive)
      const token1 = allTokens.find(t => 
        t.name.toLowerCase() === token1Name.toLowerCase() || 
        t.symbol.toLowerCase() === token1Name.toLowerCase()
      );
      const token2 = allTokens.find(t => 
        t.name.toLowerCase() === token2Name.toLowerCase() || 
        t.symbol.toLowerCase() === token2Name.toLowerCase()
      );
      
      if (!token1 || !token2) {
        setError('One or both tokens not found. Please check name or symbol and try again.');
        setIsLoading(false);
        return;
      }
      
      // Convert to comparison format
      const token1Data = convertTokenData(token1);
      const token2Data = convertTokenData(token2);
      
      setComparisonData({
        token1: token1Data,
        token2: token2Data
      });
      setIsComparing(true);
    } catch (err) {
      console.error('Error during comparison:', err);
      setError('An error occurred during comparison. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to implement search suggestions
  const handleTokenSearch = (input: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    setter(input);
  };

  // Prepare data for the bar chart comparison
  const barChartData = [
    {
      name: 'Market Cap',
      [comparisonData.token1?.symbol || 'Token 1']: comparisonData.token1?.marketCap || 0,
      [comparisonData.token2?.symbol || 'Token 2']: comparisonData.token2?.marketCap || 0,
    },
    {
      name: 'Holders',
      [comparisonData.token1?.symbol || 'Token 1']: comparisonData.token1?.holders || 0,
      [comparisonData.token2?.symbol || 'Token 2']: comparisonData.token2?.holders || 0,
    },
  ];

  // Colors for charts
  const COLORS = ['#F6BE00', '#F05252'];

  return (
    <div className="min-h-screen">
      <Navbar dashcoinTradeLink={dashcoinTradeLink} />

      <main className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="dashcoin-title text-4xl md:text-5xl text-dashYellow mb-4">TOKEN COMPARISON</h1>
          <p className="text-xl max-w-3xl">Compare any two tokens to analyze market cap, holders, and other metrics</p>
        </div>

        {/* Token Input Section */}
        <DashcoinCard className="mb-8">
          <DashcoinCardHeader>
            <DashcoinCardTitle>Enter Token Names to Compare</DashcoinCardTitle>
          </DashcoinCardHeader>
          <DashcoinCardContent>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label htmlFor="token1" className="block mb-2 text-sm font-medium">Token 1 Name</label>
                <input 
                  type="text" 
                  id="token1" 
                  value={token1Name}
                  onChange={(e) => handleTokenSearch(e.target.value, setToken1Name)}
                  className="w-full px-4 py-3 rounded-md bg-dashGreen-dark border border-dashGreen-light focus:border-dashYellow focus:outline-none"
                  placeholder="Enter token name or symbol"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="token2" className="block mb-2 text-sm font-medium">Token 2 Name</label>
                <input 
                  type="text" 
                  id="token2" 
                  value={token2Name}
                  onChange={(e) => handleTokenSearch(e.target.value, setToken2Name)}
                  className="w-full px-4 py-3 rounded-md bg-dashGreen-dark border border-dashGreen-light focus:border-dashYellow focus:outline-none"
                  placeholder="Enter token name or symbol"
                />
              </div>
              <Button 
                onClick={handleCompare}
                className="bg-dashYellow text-dashBlack hover:bg-dashYellow-dark py-6 px-8"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : 'Compare'}
              </Button>
            </div>
            {error && (
              <p className="mt-4 text-sm text-red-500">{error}</p>
            )}
            <p className="mt-4 text-sm opacity-70 flex items-center gap-2">
              <InfoIcon className="h-4 w-4" />
              Enter the token names or symbols to compare metrics
            </p>
          </DashcoinCardContent>
        </DashcoinCard>

        {isComparing && comparisonData.token1 && comparisonData.token2 && (
          <>
            {/* Comparison Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 p-4 bg-dashGreen-dark rounded-lg border border-dashGreen-light">
              <div className="flex-1 text-center p-4">
                <h3 className="text-xl text-dashYellow">{comparisonData.token1.name} ({comparisonData.token1.symbol})</h3>
                <div className="opacity-70 text-sm mt-2">
                  {comparisonData.token1.address.substring(0, 6)}...{comparisonData.token1.address.substring(comparisonData.token1.address.length - 4)}
                </div>
              </div>
              <div className="flex items-center">
                <ArrowRight className="h-8 w-8 text-dashYellow" />
              </div>
              <div className="flex-1 text-center p-4">
                <h3 className="text-xl text-dashYellow">{comparisonData.token2.name} ({comparisonData.token2.symbol})</h3>
                <div className="opacity-70 text-sm mt-2">
                  {comparisonData.token2.address.substring(0, 6)}...{comparisonData.token2.address.substring(comparisonData.token2.address.length - 4)}
                </div>
              </div>
            </div>

            {/* Market Cap & Holders Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <DashcoinCard>
                <DashcoinCardHeader>
                  <DashcoinCardTitle className="flex items-center gap-2">
                    <BarChart2 className="h-5 w-5" />
                    Market Cap Comparison
                  </DashcoinCardTitle>
                </DashcoinCardHeader>
                <DashcoinCardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[barChartData[0]]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                        <Legend />
                        <Bar dataKey={comparisonData.token1.symbol} fill="#F6BE00" />
                        <Bar dataKey={comparisonData.token2.symbol} fill="#F05252" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-md bg-dashGreen-dark">
                      <p className="text-sm opacity-70">Token 1 Market Cap</p>
                      <p className="text-xl text-dashYellow">${comparisonData.token1.marketCap.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-md bg-dashGreen-dark">
                      <p className="text-sm opacity-70">Token 2 Market Cap</p>
                      <p className="text-xl text-dashYellow">${comparisonData.token2.marketCap.toLocaleString()}</p>
                    </div>
                  </div>
                </DashcoinCardContent>
              </DashcoinCard>

              <DashcoinCard>
                <DashcoinCardHeader>
                  <DashcoinCardTitle className="flex items-center gap-2">
                    <BarChart2 className="h-5 w-5" />
                    Holders Comparison
                  </DashcoinCardTitle>
                </DashcoinCardHeader>
                <DashcoinCardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[barChartData[1]]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => Number(value).toLocaleString()} />
                        <Legend />
                        <Bar dataKey={comparisonData.token1.symbol} fill="#F6BE00" />
                        <Bar dataKey={comparisonData.token2.symbol} fill="#F05252" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-md bg-dashGreen-dark">
                      <p className="text-sm opacity-70">Token 1 Holders</p>
                      <p className="text-xl text-dashYellow">{comparisonData.token1.holders.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-md bg-dashGreen-dark">
                      <p className="text-sm opacity-70">Token 2 Holders</p>
                      <p className="text-xl text-dashYellow">{comparisonData.token2.holders.toLocaleString()}</p>
                    </div>
                  </div>
                </DashcoinCardContent>
              </DashcoinCard>
            </div>

            {/* Full Comparison Table */}
            <DashcoinCard>
              <DashcoinCardHeader>
                <DashcoinCardTitle>Detailed Comparison</DashcoinCardTitle>
              </DashcoinCardHeader>
              <DashcoinCardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-dashGreen-light">
                        <th className="text-left py-4 px-4">Metric</th>
                        <th className="text-right py-4 px-4">{comparisonData.token1.symbol}</th>
                        <th className="text-right py-4 px-4">{comparisonData.token2.symbol}</th>
                        <th className="text-right py-4 px-4">Difference</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-dashGreen-light">
                        <td className="py-3 px-4">Market Cap</td>
                        <td className="text-right py-3 px-4">${comparisonData.token1.marketCap.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">${comparisonData.token2.marketCap.toLocaleString()}</td>
                        <td className={`text-right py-3 px-4 ${comparisonData.token1.marketCap > comparisonData.token2.marketCap ? 'text-green-500' : 'text-red-500'}`}>
                          {comparisonData.token2.marketCap !== 0 ? ((comparisonData.token1.marketCap / comparisonData.token2.marketCap - 1) * 100).toFixed(2) : "N/A"}%
                        </td>
                      </tr>
                      
                      <tr className="border-b border-dashGreen-light">
                        <td className="py-3 px-4">Holders</td>
                        <td className="text-right py-3 px-4">{comparisonData.token1.holders.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">{comparisonData.token2.holders.toLocaleString()}</td>
                        <td className={`text-right py-3 px-4 ${comparisonData.token1.holders > comparisonData.token2.holders ? 'text-green-500' : 'text-red-500'}`}>
                          {comparisonData.token2.holders !== 0 ? ((comparisonData.token1.holders / comparisonData.token2.holders - 1) * 100).toFixed(2) : "N/A"}%
                        </td>
                      </tr>
                      
                      <tr className="border-b border-dashGreen-light">
                        <td className="py-3 px-4">24h Volume</td>
                        <td className="text-right py-3 px-4">${comparisonData.token1.volume24h.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">${comparisonData.token2.volume24h.toLocaleString()}</td>
                        <td className={`text-right py-3 px-4 ${comparisonData.token1.volume24h > comparisonData.token2.volume24h ? 'text-green-500' : 'text-red-500'}`}>
                          {comparisonData.token2.volume24h !== 0 ? ((comparisonData.token1.volume24h / comparisonData.token2.volume24h - 1) * 100).toFixed(2) : "N/A"}%
                        </td>
                      </tr>
                      
                      <tr className="border-b border-dashGreen-light">
                        <td className="py-3 px-4">Launch Date</td>
                        <td className="text-right py-3 px-4">{new Date(comparisonData.token1.launchDate).toLocaleDateString()}</td>
                        <td className="text-right py-3 px-4">{new Date(comparisonData.token2.launchDate).toLocaleDateString()}</td>
                        <td className="text-right py-3 px-4">
                          {Math.abs(
                            Math.floor(
                              (new Date(comparisonData.token1.launchDate).getTime() - 
                               new Date(comparisonData.token2.launchDate).getTime()) / 
                              (1000 * 60 * 60 * 24)
                            )
                          )} days
                        </td>
                      </tr>

                      <tr className="border-t border-dashGreen-light">
                        <td className="py-3 px-4">MarketCap Growth Per Day</td>
                        <td className="text-right py-3 px-4">${comparisonData.token1.marketcapgrowthperday.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">${comparisonData.token2.marketcapgrowthperday.toLocaleString()}</td>
                        <td className={`text-right py-3 px-4 ${comparisonData.token1.marketcapgrowthperday > comparisonData.token2.marketcapgrowthperday ? 'text-green-500' : 'text-red-500'}`}>
                          {comparisonData.token2.marketcapgrowthperday !== 0 ? ((comparisonData.token1.marketcapgrowthperday / comparisonData.token2.marketcapgrowthperday - 1) * 100).toFixed(2) : "N/A"}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </DashcoinCardContent>
            </DashcoinCard>
          </>
        )}
      </main>

      <footer className="container mx-auto py-8 px-4 mt-12 border-t border-dashGreen-light">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <DashcoinLogo size={32} />
          <p className="text-sm opacity-80">© 2025 Dashcoin. All rights reserved.</p>
          <a
            href={dashcoinXLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-dashYellow hover:text-dashYellow-dark transition-colors px-4 py-2 border border-dashYellow rounded-md"
          >
            <Twitter className="h-5 w-5" />
            <span className="dashcoin-text">Follow on X</span>
          </a>
        </div>
      </footer>
    </div>
  );
}