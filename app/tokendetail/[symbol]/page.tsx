"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DashcoinCard } from "@/components/ui/dashcoin-card"
import { Loader2, ArrowLeft, Twitter } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

// Define types for token research data
interface TokenResearchData {
  Symbol: string
  Score: number | string
  "Founder Doxxed": number | string
  "Startup Experience": number | string
  "Successful Exit": number | string
  "Discussed Plans for Token Integration": number | string
  "Project Has Some Virality / Popularity": number | string
  "Live Product Exists": number | string
  Twitter?: string
  [key: string]: any
}

// Function to fetch token research from Google Sheets
async function fetchTokenResearch(tokenSymbol: string): Promise<TokenResearchData | null> {
  const API_KEY = 'AIzaSyC8QxJez_UTHUJS7vFj1J3Sje0CWS9tXyk';
  const SHEET_ID = '1Nra5QH-JFAsDaTYSyu-KocjbkZ0MATzJ4R-rUt-gLe0';
  const SHEET_NAME = 'Dashcoin Scoring';
  const RANGE = `${SHEET_NAME}!A1:K26`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.values || data.values.length < 2) {
      console.warn('No data found in Google Sheet');
      return null;
    }

    const [header, ...rows] = data.values;
    
    // Create structured data from the sheet
    const structured = rows.map((row: any) => {
      const entry: Record<string, any> = {};
      header.forEach((key: string, i: number) => {
        entry[key.trim()] = row[i] || '';
      });
      return entry;
    });

    // Find the token data
    const normalizedSymbol = tokenSymbol.toUpperCase();
    const tokenData = structured.find((entry: any) => 
      entry['Project'] && 
      entry['Project'].toString().toUpperCase() === normalizedSymbol &&
      entry['Score'] // Ensure the token has a score
    );
    
    return tokenData || null;
  } catch (err) {
    console.error('Google Sheets API error:', err);
    return null;
  }
}

  // Component for displaying framework criteria with checkmarks/Xs (no longer used)
function FrameworkCriterion({ 
  label, 
  value 
}: { 
  label: string
  value: number | string | null
}) {
  // Convert value to number if it's a string (from the sheet)
  const numValue = typeof value === 'string' ? parseInt(value) : value;
  
  return (
    <div className="flex flex-col items-center text-center">
      <div className="font-semibold mb-2 text-dashYellow">{label}</div>
      <div className="text-2xl">
        {numValue === 1 ? (
          <span className="text-green-500">✅</span>
        ) : (
          <span className="text-red-500">❌</span>
        )}
      </div>
    </div>
  );
}

export default function TokenResearchPage({ params }: { params: { symbol: string } }) {
  const router = useRouter();
  const { symbol } = params;
  
  const [researchData, setResearchData] = useState<TokenResearchData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasScore, setHasScore] = useState(false);

  useEffect(() => {
    const getResearchData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchTokenResearch(symbol);
        setResearchData(data);
        setHasScore(!!data && data.Score !== undefined && data.Score !== '');
      } catch (error) {
        console.error(`Error fetching research data for ${symbol}:`, error);
      } finally {
        setIsLoading(false);
      }
    };
    
    getResearchData();
  }, [symbol]);

  // Framework criteria to display
  const frameworkCriteria = [
    "Founder Doxxed",
    "Startup Experience",
    "Successful Exit",
    "Discussed Plans for Token Integration",
    "Project Has Some Virality / Popularity",
    "Live Product Exists"
  ];

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Back button */}
      <div className="mb-6">
        <button 
          onClick={() => router.back()} 
          className="flex items-center text-dashYellow hover:text-dashYellow-dark transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Tokens
        </button>
      </div>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dashYellow">{symbol} Research</h1>
        <h2 className="flex items-center text-center justify-center dashcoin-text text-5xl text-dashYellow items center mt-8 mb-8">
            "FrameWork Score" table
        </h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-dashYellow" />
            <p className="mt-4 text-dashYellow-light">Loading research data...</p>
          </div>
        </div>
      ) : !hasScore ? (
        <DashcoinCard className="p-8 text-center">
          <h2 className="text-xl font-semibold text-dashYellow">No Research Available</h2>
          <p className="mt-4 text-dashYellow-light">
            Research data is not yet available for {symbol}. Check back later or try another token.
          </p>
        </DashcoinCard>
      ) : (
        <div className="space-y-8">
          {/* Research Score */}
          <DashcoinCard className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-dashYellow mb-4 md:mb-0">Research Score</h2>
              <div className="flex items-center">
                <div className="text-4xl font-bold text-dashYellow">
                  {typeof researchData?.Score === 'string' 
                    ? parseFloat(researchData.Score).toFixed(1) 
                    : researchData?.Score.toFixed(1)}
                </div>
                <div className="text-dashYellow-light ml-3">/ 10.0</div>
              </div>
            </div>
            
            {/* Framework Score Table */}
            <h3 className="text-lg font-medium text-dashYellow mb-4">Framework Criteria</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-dashGreen-card dark:bg-dashGreen-cardDark border-b-2 border-dashBlack">
                    {frameworkCriteria.map((criterion) => (
                      <th key={criterion} className="py-3 px-4 text-dashYellow text-center">
                        {criterion}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-dashGreen-light">
                    {frameworkCriteria.map((criterion) => {
                      const value = researchData?.[criterion];
                      const numValue = typeof value === 'string' ? parseInt(value) : value;
                      
                      return (
                        <td key={criterion} className="py-4 px-4 text-center border-r border-dashGreen-light last:border-r-0">
                          <div className="text-2xl">
                            {numValue === 1 ? (
                              <span className="text-green-500">✅</span>
                            ) : (
                              <span className="text-red-500">❌</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Twitter Button - Only if Twitter handle exists */}
            {researchData?.Twitter && (
              <div className="mt-8 flex justify-end">
                <a
                  href={`https://twitter.com/${researchData.Twitter.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#1DA1F2] hover:bg-[#1a91da] text-white px-4 py-2 rounded-md flex items-center transition-colors"
                >
                  <Twitter className="h-4 w-4 mr-2" />
                  View on Twitter
                </a>
              </div>
            )}
          </DashcoinCard>
        </div>
      )}
    </div>
  );
}