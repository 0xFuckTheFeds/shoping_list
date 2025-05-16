// app/compare/page.tsx
"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { DashcoinCard, DashcoinCardContent, DashcoinCardHeader, DashcoinCardTitle } from "@/components/ui/dashcoin-card";
import { Button } from "@/components/ui/button";
import { Twitter, BarChart2, PieChart, ArrowRight, InfoIcon } from "lucide-react";
import { DashcoinLogo } from "@/components/dashcoin-logo";

// Since this is a client component, we need to manually import these
// In a real app, you would fetch this data from your API
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsePieChart, Pie, Cell } from 'recharts';

interface TokenData {
  address: string;
  name: string;
  symbol: string;
  marketCap: number;
  holders: number;
  price: number;
  volume24h: number;
  liquidity: number;
  launchDate: string;
}

export default function ComparePage() {
  // Dashcoin trade link (used for navbar)
  const dashcoinTradeLink = "https://axiom.trade/t/fRfKGCriduzDwSudCwpL7ySCEiboNuryhZDVJtr1a1C/dashc";
  // Dashcoin X (Twitter) link
  const dashcoinXLink = "https://x.com/dune_dashcoin";

  const [token1Address, setToken1Address] = useState("");
  const [token2Address, setToken2Address] = useState("");
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonData, setComparisonData] = useState<{token1: TokenData | null, token2: TokenData | null}>({
    token1: null,
    token2: null
  });

  // Mock data for demonstration
  const mockComparisonData = {
    token1: {
      address: "7gkgsqE2Uip7LUyrqEi8fyLPNSbn7GYu9yFgtxZwYUVa",
      name: "Dashcoin",
      symbol: "DASHC",
      marketCap: 42500000,
      holders: 12850,
      price: 0.00075,
      volume24h: 3200000,
      liquidity: 2500000,
      launchDate: "2024-02-15"
    },
    token2: {
      address: "8JUjWjGgT5DNhfxRm9ZdQbVGPeYvKgxkQzeQN9QNBGz7",
      name: "Sample Token",
      symbol: "SMPL",
      marketCap: 12000000,
      holders: 5420,
      price: 0.00025,
      volume24h: 950000,
      liquidity: 850000,
      launchDate: "2024-04-01"
    }
  };

  // Function to handle comparison
  const handleCompare = () => {
    // Here you would normally fetch data using the token addresses
    // For demonstration, we'll use mock data
    setComparisonData(mockComparisonData);
    setIsComparing(true);
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

  // Prepare data for what-if market cap scenario
  const marketCapScenarioData = comparisonData.token1 && comparisonData.token2 ? [
    { name: `${comparisonData.token1.symbol} Current Price`, value: comparisonData.token1.price },
    { 
      name: `${comparisonData.token1.symbol} at ${comparisonData.token2.symbol}'s Market Cap`, 
      value: (comparisonData.token2.marketCap / (comparisonData.token1.marketCap / comparisonData.token1.price))
    }
  ] : [];

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
            <DashcoinCardTitle>Enter Token Addresses to Compare</DashcoinCardTitle>
          </DashcoinCardHeader>
          <DashcoinCardContent>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label htmlFor="token1" className="block mb-2 text-sm font-medium">Token 1 Address</label>
                <input 
                  type="text" 
                  id="token1" 
                  value={token1Address}
                  onChange={(e) => setToken1Address(e.target.value)}
                  className="w-full px-4 py-3 rounded-md bg-dashGreen-dark border border-dashGreen-light focus:border-dashYellow focus:outline-none"
                  placeholder="Enter contract address"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="token2" className="block mb-2 text-sm font-medium">Token 2 Address</label>
                <input 
                  type="text" 
                  id="token2" 
                  value={token2Address}
                  onChange={(e) => setToken2Address(e.target.value)}
                  className="w-full px-4 py-3 rounded-md bg-dashGreen-dark border border-dashGreen-light focus:border-dashYellow focus:outline-none"
                  placeholder="Enter contract address"
                />
              </div>
              <Button 
                onClick={handleCompare}
                className="bg-dashYellow text-dashBlack hover:bg-dashYellow-dark py-6 px-8"
              >
                Compare
              </Button>
            </div>
            <p className="mt-4 text-sm opacity-70 flex items-center gap-2">
              <InfoIcon className="h-4 w-4" />
              For demonstration purposes, clicking Compare will show sample data
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

            {/* Market Cap What-If Scenario */}
            <DashcoinCard className="mb-8">
              <DashcoinCardHeader>
                <DashcoinCardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  What If {comparisonData.token1.symbol} Had {comparisonData.token2.symbol}'s Market Cap?
                </DashcoinCardTitle>
              </DashcoinCardHeader>
              <DashcoinCardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-1">
                    <div className="p-6 rounded-md bg-dashGreen-dark h-full flex flex-col justify-center">
                      <h3 className="text-lg mb-6 text-center">Price Comparison</h3>
                      
                      <div className="space-y-6">
                        <div>
                          <p className="text-sm opacity-70">Current {comparisonData.token1.symbol} Price</p>
                          <p className="text-2xl text-dashYellow">${comparisonData.token1.price.toFixed(8)}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm opacity-70">Potential {comparisonData.token1.symbol} Price at {comparisonData.token2.symbol}'s Market Cap</p>
                          <p className="text-2xl text-dashYellow">${(comparisonData.token2.marketCap / (comparisonData.token1.marketCap / comparisonData.token1.price)).toFixed(8)}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm opacity-70">Potential Gain/Loss</p>
                          <p className={`text-2xl ${(comparisonData.token2.marketCap > comparisonData.token1.marketCap) ? 'text-green-500' : 'text-red-500'}`}>
                            {((comparisonData.token2.marketCap / comparisonData.token1.marketCap) * 100 - 100).toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2 h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsePieChart>
                        <Pie
                          data={marketCapScenarioData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {marketCapScenarioData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `$${Number(value).toFixed(8)}`} />
                        <Legend />
                      </RechartsePieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </DashcoinCardContent>
            </DashcoinCard>

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
                        <td className="py-3 px-4">Price</td>
                        <td className="text-right py-3 px-4">${comparisonData.token1.price.toFixed(8)}</td>
                        <td className="text-right py-3 px-4">${comparisonData.token2.price.toFixed(8)}</td>
                        <td className={`text-right py-3 px-4 ${comparisonData.token1.price > comparisonData.token2.price ? 'text-green-500' : 'text-red-500'}`}>
                          {((comparisonData.token1.price / comparisonData.token2.price - 1) * 100).toFixed(2)}%
                        </td>
                      </tr>
                      
                      <tr className="border-b border-dashGreen-light">
                        <td className="py-3 px-4">Market Cap</td>
                        <td className="text-right py-3 px-4">${comparisonData.token1.marketCap.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">${comparisonData.token2.marketCap.toLocaleString()}</td>
                        <td className={`text-right py-3 px-4 ${comparisonData.token1.marketCap > comparisonData.token2.marketCap ? 'text-green-500' : 'text-red-500'}`}>
                          {((comparisonData.token1.marketCap / comparisonData.token2.marketCap - 1) * 100).toFixed(2)}%
                        </td>
                      </tr>
                      
                      <tr className="border-b border-dashGreen-light">
                        <td className="py-3 px-4">Holders</td>
                        <td className="text-right py-3 px-4">{comparisonData.token1.holders.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">{comparisonData.token2.holders.toLocaleString()}</td>
                        <td className={`text-right py-3 px-4 ${comparisonData.token1.holders > comparisonData.token2.holders ? 'text-green-500' : 'text-red-500'}`}>
                          {((comparisonData.token1.holders / comparisonData.token2.holders - 1) * 100).toFixed(2)}%
                        </td>
                      </tr>
                      
                      <tr className="border-b border-dashGreen-light">
                        <td className="py-3 px-4">24h Volume</td>
                        <td className="text-right py-3 px-4">${comparisonData.token1.volume24h.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">${comparisonData.token2.volume24h.toLocaleString()}</td>
                        <td className={`text-right py-3 px-4 ${comparisonData.token1.volume24h > comparisonData.token2.volume24h ? 'text-green-500' : 'text-red-500'}`}>
                          {((comparisonData.token1.volume24h / comparisonData.token2.volume24h - 1) * 100).toFixed(2)}%
                        </td>
                      </tr>
                      
                      <tr className="border-b border-dashGreen-light">
                        <td className="py-3 px-4">Liquidity</td>
                        <td className="text-right py-3 px-4">${comparisonData.token1.liquidity.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">${comparisonData.token2.liquidity.toLocaleString()}</td>
                        <td className={`text-right py-3 px-4 ${comparisonData.token1.liquidity > comparisonData.token2.liquidity ? 'text-green-500' : 'text-red-500'}`}>
                          {((comparisonData.token1.liquidity / comparisonData.token2.liquidity - 1) * 100).toFixed(2)}%
                        </td>
                      </tr>
                      
                      <tr>
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