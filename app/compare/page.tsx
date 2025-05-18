// app/compare/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/navbar";
import { DashcoinCard, DashcoinCardContent, DashcoinCardHeader, DashcoinCardTitle } from "@/components/ui/dashcoin-card";
import { Button } from "@/components/ui/button";
import { Twitter, BarChart2, Users, ArrowRight, InfoIcon, Loader2, ArrowLeftRight } from "lucide-react";
import { DashcoinLogo } from "@/components/dashcoin-logo";
import { GrowthStatCard } from "@/components/ui/growth-stat-card";

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TokenData {
  token: string;
  name: string;
  symbol: string;
  marketCap: number;
  num_holders: number;
  volume24h: number;
  first_trade_time: string;
  marketcapgrowthperday: number;
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

const formatNumber = (num: number): string => {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(2) + 'B';
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(2) + 'K';
  }
  return num.toLocaleString();
};

// Updated calculateMultiple function
const calculateMultiple = (value1: number, value2: number): string => {
  if (value2 === 0) {
    return value1 === 0 ? "0.0x" : "N/A";
  }
  if (value1 === 0) { // value2 is not 0 here
    return "0.0x";
  }
  // Both value1 and value2 are non-zero (assuming positive metrics based on context)
  const actualMultiple = value1 / value2;

  if (actualMultiple < 0.1) {
    return "<0.1x";
  }

  const roundedMultiple = Math.ceil(actualMultiple * 10) / 10;
  return `${roundedMultiple.toFixed(1)}x`;
};

// Helper function to determine color class for the difference multiple
const getDifferenceColorClass = (value1: number, value2: number, multipleString: string): string => {
  if (multipleString === "N/A" || multipleString === "0.0x") {
    return 'opacity-70';
  }
  if (value1 > value2) {
    return 'text-green-500';
  }
  if (value1 < value2) {
    return 'text-red-500';
  }
  // value1 === value2 (multipleString should be "1.0x")
  return 'opacity-70'; 
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-dashGreen-darker border border-dashGreen-light rounded-md shadow-lg">
        <p className="label text-dashYellow">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm">
            {`${entry.name} : ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ComparePage() {
  const dashcoinTradeLink = "https://axiom.trade/t/fRfKGCriduzDwSudCwpL7ySCEiboNuryhZDVJtr1a1C/dashc";
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

  const [token1Suggestions, setToken1Suggestions] = useState<TokenData[]>([]);
  const [token2Suggestions, setToken2Suggestions] = useState<TokenData[]>([]);
  const [showToken1Suggestions, setShowToken1Suggestions] = useState(false);
  const [showToken2Suggestions, setShowToken2Suggestions] = useState(false);

  const token1SuggestionsRef = useRef<HTMLDivElement>(null);
  const token2SuggestionsRef = useRef<HTMLDivElement>(null);

  const dummyAllTokens: TokenData[] = [
    { token: "7gkgsqE2Uip7LUyrqEi8fyLPNSbn7GYu9yFgtxZwYUVa", name: "Dashcoin", symbol: "DASHC", marketCap: 50000000, num_holders: 12000, volume24h: 1200000, first_trade_time: "2024-03-01T10:00:00Z", marketcapgrowthperday: 0 },
    { token: "EKpQGSJtjMFqKZgxbHmSEii3G1uhtqpEiW2kQXsH278W", name: "Solana", symbol: "SOL", marketCap: 60000000000, num_holders: 500000, volume24h: 2000000000, first_trade_time: "2020-03-10T10:00:00Z", marketcapgrowthperday: 0 },
    { token: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", name: "Marinade staked SOL", symbol: "mSOL", marketCap: 1000000000, num_holders: 100000, volume24h: 50000000, first_trade_time: "2021-06-01T10:00:00Z", marketcapgrowthperday: 0 },
    { token: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", name: "USD Coin", symbol: "USDC", marketCap: 30000000000, num_holders: 1000000, volume24h: 5000000000, first_trade_time: "2018-09-26T10:00:00Z", marketcapgrowthperday: 0 },
    { token: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsrsA", name: "Jupiter", symbol: "JUP", marketCap: 2000000000, num_holders: 200000, volume24h: 100000000, first_trade_time: "2024-01-31T10:00:00Z", marketcapgrowthperday: 0 },
    { token: "DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ", name: "DUST Protocol", symbol: "DUST", marketCap: 50000000, num_holders: 30000, volume24h: 1000000, first_trade_time: "2022-03-15T10:00:00Z", marketcapgrowthperday: 0 },
  ];

  useEffect(() => {
    setIsLoading(true);
    setAllTokens(dummyAllTokens);
    setIsLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (token1SuggestionsRef.current && !token1SuggestionsRef.current.contains(event.target as Node)) {
        setShowToken1Suggestions(false);
      }
      if (token2SuggestionsRef.current && !token2SuggestionsRef.current.contains(event.target as Node)) {
        setShowToken2Suggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [token1SuggestionsRef, token2SuggestionsRef]);

  const calculateMarketCapGrowthPerDay = (marketCap: number, launchDate: string): number => {
    const creationDate = new Date(launchDate);
    const today = new Date();
    const differenceInTime = today.getTime() - creationDate.getTime();
    const differenceInDays = Math.max(1, Math.floor(differenceInTime / (1000 * 3600 * 24)));
    return marketCap / differenceInDays;
  };

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

  const handleCompare = () => {
    setIsLoading(true);
    setError(null);
    try {
      const token1 = allTokens.find(t => t.name.toLowerCase() === token1Name.toLowerCase() || t.symbol.toLowerCase() === token1Name.toLowerCase());
      const token2 = allTokens.find(t => t.name.toLowerCase() === token2Name.toLowerCase() || t.symbol.toLowerCase() === token2Name.toLowerCase());
      if (!token1 || !token2) {
        setError('One or both tokens not found. Please check name or symbol and try again.');
        setIsLoading(false);
        return;
      }
      const token1Data = convertTokenData(token1);
      const token2Data = convertTokenData(token2);
      setComparisonData({ token1: token1Data, token2: token2Data });
      setIsComparing(true);
    } catch (err) {
      console.error('Error during comparison:', err);
      setError('An error occurred during comparison. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReverseCompare = () => {
    if (!comparisonData.token1 || !comparisonData.token2) return;

    setComparisonData(prevData => ({
      token1: prevData.token2,
      token2: prevData.token1
    }));

    // Swap the names in the input fields as well to maintain consistency
    const currentToken1Name = token1Name;
    setToken1Name(token2Name);
    setToken2Name(currentToken1Name);
  };

  const handleTokenSearch = (
    input: string, 
    nameSetter: React.Dispatch<React.SetStateAction<string>>,
    suggestionsSetter: React.Dispatch<React.SetStateAction<TokenData[]>>,
    showSuggestionsSetter: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    nameSetter(input);
    if (input.length > 0) {
      const filtered = allTokens.filter(token => 
        token.name.toLowerCase().includes(input.toLowerCase()) || 
        token.symbol.toLowerCase().includes(input.toLowerCase())
      );
      suggestionsSetter(filtered);
      showSuggestionsSetter(true);
    } else {
      suggestionsSetter([]);
      showSuggestionsSetter(false);
    }
  };

  const handleSuggestionClick = (
    tokenName: string,
    nameSetter: React.Dispatch<React.SetStateAction<string>>,
    suggestionsSetter: React.Dispatch<React.SetStateAction<TokenData[]>>,
    showSuggestionsSetter: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    nameSetter(tokenName);
    suggestionsSetter([]);
    showSuggestionsSetter(false);
  };

  const barChartData = comparisonData.token1 && comparisonData.token2 ? [
    {
      name: 'Market Cap',
      [comparisonData.token1.symbol]: comparisonData.token1.marketCap,
      [comparisonData.token2.symbol]: comparisonData.token2.marketCap,
    },
    {
      name: 'Holders',
      [comparisonData.token1.symbol]: comparisonData.token1.holders,
      [comparisonData.token2.symbol]: comparisonData.token2.holders,
    },
  ] : [];
  
  const GREEN_COLOR = "#10B981";
  const RED_COLOR = "#EF4444";

  let token1ScaleClass = "scale-100 transform-origin-top";
  let token2ScaleClass = "scale-100 transform-origin-top";
  let token1IsWinner = false;
  let token2IsWinner = false;
  let token1AnimationClasses = "";
  let token2AnimationClasses = "";
  const flashyAnimations = "breathing-border breathing-shadow"; // Base flashy animations for the winner

  if (comparisonData.token1 && comparisonData.token2) {
    if (comparisonData.token1.marketcapgrowthperday > comparisonData.token2.marketcapgrowthperday) {
      token1ScaleClass = "scale-150 transform-origin-top";
      token1IsWinner = true;
      token1AnimationClasses = flashyAnimations;
    } else if (comparisonData.token2.marketcapgrowthperday > comparisonData.token1.marketcapgrowthperday) {
      token2ScaleClass = "scale-150 transform-origin-top";
      token2IsWinner = true;
      token2AnimationClasses = flashyAnimations;
    } // If equal, both remain scale-100, tokenXIsWinner remains false, and no extra animations from this logic
  }

  let token1MarketCapColor = RED_COLOR;
  let token2MarketCapColor = GREEN_COLOR;
  if (comparisonData.token1 && comparisonData.token2) {
    if (comparisonData.token1.marketCap >= comparisonData.token2.marketCap) {
      token1MarketCapColor = GREEN_COLOR;
      token2MarketCapColor = RED_COLOR;
    } else {
      token1MarketCapColor = RED_COLOR;
      token2MarketCapColor = GREEN_COLOR;
    }
  }

  let token1HoldersColor = RED_COLOR;
  let token2HoldersColor = GREEN_COLOR;
  if (comparisonData.token1 && comparisonData.token2) {
    if (comparisonData.token1.holders >= comparisonData.token2.holders) {
      token1HoldersColor = GREEN_COLOR;
      token2HoldersColor = RED_COLOR;
    } else {
      token1HoldersColor = RED_COLOR;
      token2HoldersColor = GREEN_COLOR;
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar dashcoinTradeLink={dashcoinTradeLink} />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-8 text-center">
          <h1 className="dashcoin-title text-4xl md:text-5xl text-dashYellow mb-4">TOKEN COMPARISON</h1>
          <p className="text-xl max-w-3xl mx-auto">Compare any two tokens to analyze market cap, holders, and other metrics</p>
        </div>

        <DashcoinCard className="mb-8">
          <DashcoinCardHeader><DashcoinCardTitle className="text-center">Enter Token Names to Compare</DashcoinCardTitle></DashcoinCardHeader>
          <DashcoinCardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleCompare(); }} className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                <div className="flex-1 relative" ref={token1SuggestionsRef}>
                  <label htmlFor="token1" className="block mb-2 text-sm font-medium text-center w-full">Token 1 Name</label>
                  <input type="text" id="token1" value={token1Name}
                    onChange={(e) => handleTokenSearch(e.target.value, setToken1Name, setToken1Suggestions, setShowToken1Suggestions)}
                    onFocus={() => token1Suggestions.length > 0 && setShowToken1Suggestions(true)}
                    className="w-full px-4 py-3 rounded-md bg-dashGreen-dark border border-dashGreen-light focus:border-dashYellow focus:outline-none"
                    placeholder="Enter token name or symbol (e.g. Dashcoin or DASHC)" autoComplete="off" />
                  {showToken1Suggestions && token1Suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-dashYellow border border-dashGreen-light rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {token1Suggestions.map(token => (
                        <div 
                          key={token.token} 
                          onClick={() => handleSuggestionClick(token.name, setToken1Name, setToken1Suggestions, setShowToken1Suggestions)}
                          className="px-4 py-2 text-dashBlack hover:bg-yellow-500 hover:text-white cursor-pointer"
                        >
                          {token.name} ({token.symbol})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex-1 relative" ref={token2SuggestionsRef}>
                  <label htmlFor="token2" className="block mb-2 text-sm font-medium text-center w-full">Token 2 Name</label>
                  <input type="text" id="token2" value={token2Name}
                    onChange={(e) => handleTokenSearch(e.target.value, setToken2Name, setToken2Suggestions, setShowToken2Suggestions)}
                    onFocus={() => token2Suggestions.length > 0 && setShowToken2Suggestions(true)}
                    className="w-full px-4 py-3 rounded-md bg-dashGreen-dark border border-dashGreen-light focus:border-dashYellow focus:outline-none"
                    placeholder="Enter token name or symbol (e.g. Solana or SOL)" autoComplete="off" />
                  {showToken2Suggestions && token2Suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-dashYellow border border-dashGreen-light rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {token2Suggestions.map(token => (
                        <div 
                          key={token.token} 
                          onClick={() => handleSuggestionClick(token.name, setToken2Name, setToken2Suggestions, setShowToken2Suggestions)}
                          className="px-4 py-2 text-dashBlack hover:bg-yellow-500 hover:text-white cursor-pointer"
                        >
                          {token.name} ({token.symbol})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Button type="submit" onClick={handleCompare} className="bg-dashYellow text-dashBlack hover:bg-yellow-500 hover:text-white py-6 px-8 w-full md:w-auto" disabled={isLoading}>
                  {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading...</>) : 'Compare'}
                </Button>
              </div>
              {error && (<p className="mt-4 text-sm text-red-500 text-center">{error}</p>)}
              <p className="mt-2 text-sm opacity-70 flex items-center gap-2 justify-center"><InfoIcon className="h-4 w-4" />Enter the token names or symbols to compare metrics</p>
            </form>
          </DashcoinCardContent>
        </DashcoinCard>

        {isComparing && comparisonData.token1 && comparisonData.token2 && (
          <>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 p-4 bg-dashGreen-dark rounded-lg border border-dashGreen-light">
              <div className="flex-1 text-center p-4">
                <h3 className="text-xl text-dashYellow">{comparisonData.token1.name} ({comparisonData.token1.symbol})</h3>
                <div className="opacity-70 text-sm mt-2">{comparisonData.token1.address.substring(0, 6)}...{comparisonData.token1.address.substring(comparisonData.token1.address.length - 4)}</div>
              </div>
              <div className="flex items-center">
                <button 
                  onClick={handleReverseCompare} 
                  className="p-2 rounded-md hover:bg-dashGreen-light focus:outline-none focus:ring-2 focus:ring-dashYellow transition-colors"
                  aria-label="Reverse token comparison"
                >
                  <ArrowLeftRight className="h-8 w-8 text-dashYellow" />
                </button>
              </div>
              <div className="flex-1 text-center p-4">
                <h3 className="text-xl text-dashYellow">{comparisonData.token2.name} ({comparisonData.token2.symbol})</h3>
                <div className="opacity-70 text-sm mt-2">{comparisonData.token2.address.substring(0, 6)}...{comparisonData.token2.address.substring(comparisonData.token2.address.length - 4)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="flex flex-col gap-4">
                <DashcoinCard>
                  <DashcoinCardHeader><DashcoinCardTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5" />Market Cap Comparison</DashcoinCardTitle></DashcoinCardHeader>
                  <DashcoinCardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={barChartData.slice(0,1)} margin={{ top: 20, right: 30, left: 50, bottom: 5 }}>
                          <XAxis dataKey="name" />
                          <YAxis tickFormatter={formatNumber} />
                          <Tooltip 
                            content={<CustomTooltip />} 
                            cursor={false} 
                            formatter={(value: any, name: any, entry: any) => {
                                if (entry.dataKey === comparisonData.token1?.symbol || entry.dataKey === comparisonData.token2?.symbol) {
                                   const numValue = Number(value);
                                   if (!isNaN(numValue)) return [`$${numValue.toLocaleString()}`, entry.name];
                                }
                                return [value, entry.name]; // Fallback for safety
                            }}
                          />
                          <Legend />
                          <Bar dataKey={comparisonData.token1.symbol} fill={token1MarketCapColor} />
                          <Bar dataKey={comparisonData.token2.symbol} fill={token2MarketCapColor} />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-md bg-dashGreen-dark"><p className="text-sm opacity-70">{`${comparisonData.token1.name} Market Cap`}</p><p className="text-xl text-dashYellow">${comparisonData.token1.marketCap.toLocaleString()}</p></div>
                      <div className="p-3 rounded-md bg-dashGreen-dark"><p className="text-sm opacity-70">{`${comparisonData.token2.name} Market Cap`}</p><p className="text-xl text-dashYellow">${comparisonData.token2.marketCap.toLocaleString()}</p></div>
                    </div>
                  </DashcoinCardContent>
                </DashcoinCard>
                <GrowthStatCard 
                  value={`+$${formatNumber(comparisonData.token1.marketcapgrowthperday)} / day`}
                  label={`${comparisonData.token1.name} has added +$${formatNumber(comparisonData.token1.marketcapgrowthperday)} in marketcap per day since creation.`}
                  className={`w-full mt-4 ${token1ScaleClass} ${token1AnimationClasses} transition-transform duration-300`}
                  isWinner={token1IsWinner}
                />
              </div>

              <div className="flex flex-col gap-4">
                <DashcoinCard>
                  <DashcoinCardHeader><DashcoinCardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Holders Comparison</DashcoinCardTitle></DashcoinCardHeader>
                  <DashcoinCardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={barChartData.slice(1,2)} margin={{ top: 20, right: 30, left: 50, bottom: 5 }}>
                          <XAxis dataKey="name" />
                          <YAxis tickFormatter={formatNumber} />
                          <Tooltip 
                            content={<CustomTooltip />} 
                            cursor={false} 
                            formatter={(value: any) => Number(value).toLocaleString()}
                          />
                          <Legend />
                          <Bar dataKey={comparisonData.token1.symbol} fill={token1HoldersColor} />
                          <Bar dataKey={comparisonData.token2.symbol} fill={token2HoldersColor} />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-md bg-dashGreen-dark"><p className="text-sm opacity-70">{`${comparisonData.token1.name} Holders`}</p><p className="text-xl text-dashYellow">{comparisonData.token1.holders.toLocaleString()}</p></div>
                      <div className="p-3 rounded-md bg-dashGreen-dark"><p className="text-sm opacity-70">{`${comparisonData.token2.name} Holders`}</p><p className="text-xl text-dashYellow">{comparisonData.token2.holders.toLocaleString()}</p></div>
                    </div>
                  </DashcoinCardContent>
                </DashcoinCard>
                <GrowthStatCard 
                  value={`+$${formatNumber(comparisonData.token2.marketcapgrowthperday)} / day`}
                  label={`${comparisonData.token2.name} has added +$${formatNumber(comparisonData.token2.marketcapgrowthperday)} in marketcap per day since creation.`}
                  className={`w-full mt-4 ${token2ScaleClass} ${token2AnimationClasses} transition-transform duration-300`}
                  isWinner={token2IsWinner}
                />
              </div>
            </div>

            <DashcoinCard>
              <DashcoinCardHeader><DashcoinCardTitle>Detailed Comparison</DashcoinCardTitle></DashcoinCardHeader>
              <DashcoinCardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-dashGreen-light">
                        <th className="text-left py-3 px-4 font-semibold">Metric</th>
                        <th className="text-right py-3 px-4 font-semibold">{comparisonData.token1.symbol}</th>
                        <th className="text-right py-3 px-4 font-semibold">{comparisonData.token2.symbol}</th>
                        <th className="text-right py-3 px-4 font-semibold">Difference</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-dashGreen-light">
                        <td className="py-3 px-4">Market Cap</td>
                        <td className="text-right py-3 px-4">${comparisonData.token1.marketCap.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">${comparisonData.token2.marketCap.toLocaleString()}</td>
                        {(() => {
                          const v1 = comparisonData.token1.marketCap;
                          const v2 = comparisonData.token2.marketCap;
                          const multipleStr = calculateMultiple(v1, v2);
                          const colorClass = getDifferenceColorClass(v1, v2, multipleStr);
                          return (
                            <td className={`text-right py-3 px-4 ${colorClass}`}>
                              {multipleStr}
                            </td>
                          );
                        })()}
                      </tr>
                      <tr className="border-b border-dashGreen-light">
                        <td className="py-3 px-4">Holders</td>
                        <td className="text-right py-3 px-4">{comparisonData.token1.holders.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">{comparisonData.token2.holders.toLocaleString()}</td>
                        {(() => {
                          const v1 = comparisonData.token1.holders;
                          const v2 = comparisonData.token2.holders;
                          const multipleStr = calculateMultiple(v1, v2);
                          const colorClass = getDifferenceColorClass(v1, v2, multipleStr);
                          return (
                            <td className={`text-right py-3 px-4 ${colorClass}`}>
                              {multipleStr}
                            </td>
                          );
                        })()}
                      </tr>
                      <tr className="border-b border-dashGreen-light">
                        <td className="py-3 px-4">Total Volume</td>
                        <td className="text-right py-3 px-4">${comparisonData.token1.volume24h.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">${comparisonData.token2.volume24h.toLocaleString()}</td>
                        {(() => {
                          const v1 = comparisonData.token1.volume24h;
                          const v2 = comparisonData.token2.volume24h;
                          const multipleStr = calculateMultiple(v1, v2);
                          const colorClass = getDifferenceColorClass(v1, v2, multipleStr);
                          return (
                            <td className={`text-right py-3 px-4 ${colorClass}`}>
                              {multipleStr}
                            </td>
                          );
                        })()}
                      </tr>
                      <tr className="border-b border-dashGreen-light">
                        <td className="py-3 px-4">Launch Date</td>
                        <td className="text-right py-3 px-4">{new Date(comparisonData.token1.launchDate).toLocaleDateString()}</td>
                        <td className="text-right py-3 px-4">{new Date(comparisonData.token2.launchDate).toLocaleDateString()}</td>
                        <td className="text-right py-3 px-4 opacity-70">
                          {Math.abs(Math.floor((new Date(comparisonData.token1.launchDate).getTime() - new Date(comparisonData.token2.launchDate).getTime()) / (1000 * 60 * 60 * 24)))} days
                        </td>
                      </tr>
                      <tr className="border-t border-dashGreen-light last:border-b-0">
                        <td className="py-3 px-4">MarketCap Growth/Day</td>
                        <td className="text-right py-3 px-4">${comparisonData.token1.marketcapgrowthperday.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">${comparisonData.token2.marketcapgrowthperday.toLocaleString()}</td>
                        {(() => {
                          const v1 = comparisonData.token1.marketcapgrowthperday;
                          const v2 = comparisonData.token2.marketcapgrowthperday;
                          const multipleStr = calculateMultiple(v1, v2);
                          const colorClass = getDifferenceColorClass(v1, v2, multipleStr);
                          return (
                            <td className={`text-right py-3 px-4 ${colorClass}`}>
                              {multipleStr}
                            </td>
                          );
                        })()}
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
          <a href={dashcoinXLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-dashYellow hover:text-dashYellow-dark transition-colors px-4 py-2 border border-dashYellow rounded-md">
            <Twitter className="h-5 w-5" />
            <span className="dashcoin-text">Follow on X</span>
          </a>
        </div>
      </footer>
    </div>
  );
}