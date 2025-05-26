import Image from "next/image";
import { DashcoinLogo } from "@/components/dashcoin-logo";
import {
  DashcoinCard,
  DashcoinCardHeader,
  DashcoinCardTitle,
  DashcoinCardContent,
  DashcoinCacheStatus,
} from "@/components/ui/dashcoin-card";
import { MarketCapChart } from "@/components/market-cap-chart";
import { MarketCapPie } from "@/components/market-cap-pie";
import {
  fetchMarketCapOverTime,
  fetchMarketStats,
  fetchPaginatedTokens,
  fetchTokenMarketCaps,
  fetchTotalMarketCap,
  getTimeUntilNextDuneRefresh,
} from "./actions/dune-actions";
import { fetchDexscreenerTokenData } from "./actions/dexscreener-actions";
import { formatCurrency } from "@/lib/utils";
import EnvSetup from "./env-setup";
import { Suspense } from "react";
import TokenTable from "@/components/token-table";
import { CopyAddress } from "@/components/copy-address";
import { DuneQueryLink } from "@/components/dune-query-link";
import { Navbar } from "@/components/navbar";
import { Twitter } from "lucide-react";

const MarketCapChartWrapper = async ({
  marketCapTimeDataPromise,
}: {
  marketCapTimeDataPromise: Promise<any>;
}) => {
  try {
    const marketCapTimeData = await marketCapTimeDataPromise;
    return <MarketCapChart data={marketCapTimeData || []} />;
  } catch (error) {
    console.error("Error in MarketCapChartWrapper:", error);
    return (
      <DashcoinCard className="h-80 flex items-center justify-center">
        <p>Error loading chart data</p>
      </DashcoinCard>
    );
  }
};

const MarketCapPieWrapper = async ({
  tokenMarketCapsPromise,
}: {
  tokenMarketCapsPromise: Promise<any>;
}) => {
  try {
    const tokenMarketCaps = await tokenMarketCapsPromise;
    return <MarketCapPie data={tokenMarketCaps || []} />;
  } catch (error) {
    console.error("Error in MarketCapPieWrapper:", error);
    return (
      <DashcoinCard className="h-80 flex items-center justify-center">
        <p>Error loading chart data</p>
      </DashcoinCard>
    );
  }
};

const TokenTableWrapper = async ({
  tokenDataPromise,
}: {
  tokenDataPromise: Promise<any>;
}) => {
  try {
    const tokenData = await tokenDataPromise;
    return (
      <TokenTable
        data={
          tokenData || {
            tokens: [],
            page: 1,
            pageSize: 10,
            totalTokens: 0,
            totalPages: 1,
          }
        }
      />
    );
  } catch (error) {
    console.error("Error in TokenTableWrapper:", error);
    return (
      <DashcoinCard className="p-8 flex items-center justify-center">
        <p className="text-center">Error loading token data</p>
      </DashcoinCard>
    );
  }
};

export default async function Home() {
  const hasDuneApiKey = !!process.env.DUNE_API_KEY;
  if (!hasDuneApiKey) {
    return <EnvSetup />;
  }
  const dashcoinCA = "7gkgsqE2Uip7LUyrqEi8fyLPNSbn7GYu9yFgtxZwYUVa";
  const dashcoinTradeLink =
    "https://axiom.trade/meme/Fjq9SmWmtnETAVNbir1eXhrVANi1GDoHEA4nb4tNn7w6/@dashc";
  const dashcoinXLink = "https://x.com/dune_dashcoin";
  const marketStatsPromise = fetchMarketStats().then(data => {
    return data;
  }).catch((error) => {
    console.error("Error fetching market stats:", error);
    return {
      totalMarketCap: 0,
      volume24h: 0,
      transactions24h: 0,
      feeEarnings24h: 0,
      lifetimeVolume: 0,
      coinLaunches: 0,
    };
  });

  const tokenDataPromise = fetchPaginatedTokens(1, 10, "marketCap", "desc").then(data => {
    return data;
  }).catch((error) => {
    console.error("error.fetching tokens makret cap", error);
    return {}
    });

  const marketCapTimeDataPromise = fetchMarketCapOverTime().catch((error) => {
    console.error("Error fetching market cap over time:", error);
    return [];
  });
    
  const tokenMarketCapsPromise = fetchTokenMarketCaps().then(data => {
    return data;
  }).catch((error) => {
    console.error("error.fetching tokens makret cap", error);
    return {}
    });
  
  const totalMarketCapPromise = fetchTotalMarketCap().catch((error) => {
    console.error("Error fetching total market cap:", error);
    return { latest_data_at: new Date().toISOString(), total_marketcap_usd: 0 };
  });

  const dexscreenerDataPromise = fetchDexscreenerTokenData(dashcoinCA).catch(
    (error) => {
      console.error("Error fetching Dexscreener data:", error);
      return null;
    }
  );

  let marketStats, totalMarketCap, dexscreenerData;
  try {
    [marketStats, totalMarketCap, dexscreenerData] = await Promise.all([
      marketStatsPromise,
      totalMarketCapPromise,
      dexscreenerDataPromise,
    ]);
  } catch (error) {
    console.error("Error awaiting promises:", error);
    marketStats = {
      totalMarketCap: 0,
      volume24h: 0,
      transactions24h: 0,
      feeEarnings24h: 0,
      lifetimeVolume: 0,
      coinLaunches: 0,
    };
    totalMarketCap = {
      latest_data_at: new Date().toISOString(),
      total_marketcap_usd: 0,
    };
    dexscreenerData = null;
  }

  let timeRemaining = 0;
  let lastRefreshTime = new Date(Date.now() -  34 * 60 * 1000); // Default to 1 hours ago

  try {
    const refreshInfo = await getTimeUntilNextDuneRefresh();
    timeRemaining = refreshInfo.timeRemaining;
    lastRefreshTime = refreshInfo.lastRefreshTime;
  } catch (error) {
    console.error("Error getting refresh time info:", error);
  }

  const nextRefreshTime = new Date(
    lastRefreshTime.getTime() + 1 * 60 * 60 * 1000
  );

  const formattedLastRefresh = lastRefreshTime.toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "medium",
  });
  const formattedNextRefresh = nextRefreshTime.toLocaleString();

  const hoursUntilRefresh = Math.floor(timeRemaining / (2 * 60 * 60 * 1000));
  const minutesUntilRefresh = Math.floor(
    (timeRemaining % (60 * 60 * 1000)) / (60 * 1000)
  );

  const formattedMarketCap = formatCurrency(
    marketStats?.totalMarketCap || 0
  );
  const formattedVolume = formatCurrency(marketStats?.volume24h || 0);
  const formattedFeeEarnings = formatCurrency(marketStats?.feeEarnings24h || 0);
  const formattedCoinLaunches = (marketStats?.coinLaunches || 0).toLocaleString();

  let dashcPrice = 0;
  let dashcMarketCap = 0;
  let dashcVolume = 0;
  let dashcChange24h = 0;
  let dashcLiquidity = 0;
  const dashcHolders = 0; 
  let dashcPairAddress = "";
  let lastUpdated = new Date().toLocaleString();

  if (dexscreenerData && dexscreenerData.pairs && dexscreenerData.pairs.length > 0) {
    const pair = dexscreenerData.pairs[0];

    dashcPrice = Number(pair.priceUsd || 0);
    dashcMarketCap = pair.fdv || 0;
    dashcVolume = pair.volume?.h24 || 0;
    dashcChange24h = pair.priceChange?.h24 || 0;
    dashcLiquidity = pair.liquidity?.usd || 0;
    dashcPairAddress = pair.pairAddress || "";

    //@ts-ignore
    if (pair.updatedAt) {
      //@ts-ignore
      lastUpdated = new Date(pair.updatedAt).toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "medium",
      });
    }
  }

  return (
    <div className="min-h-screen">
      {/* Use the new Navbar component */}
      <Navbar dashcoinTradeLink={dashcoinTradeLink} />

      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Hero Section with Frog Soldiers */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-4 mb-4">
            <div className="w-24 h-24 md:w-32 md:h-32 relative">
              <Image
                src="/images/frog-soldier.png"
                alt="Dashcoin Frog Soldier"
                width={128}
                height={128}
                className="object-contain rounded-full overflow-hidden"
                style={{ clipPath: "circle(50%)" }} 
              />
            </div>
            <div className="flex flex-col">
              <h1 className="dashcoin-title-hq text-5xl md:text-8xl text-dashYellow">
                DASHCOIN HQ
              </h1>
              <p className="text-xl">Your Research hub for tokens launched on the Believe app</p>
            </div>
            
            <div className="w-24 h-24 md:w-32 md:h-32 relative">
              <Image
                src="/images/frog-soldier.png"
                alt="Dashcoin Frog Soldier"
                width={128}
                height={128}
                className="object-contain scale-x-[-1] rounded-full overflow-hidden"
                style={{ clipPath: "circle(50%)" }}
              />
            </div>
          </div>
          {/* DASHC Token Stats Row */}
          <div className="mt-4 mb-6 py-2 px-4 bg-dashGreen-dark rounded-lg border border-dashBlack flex flex-wrap justify-between items-center gap-2 max-w-4xl mx-auto">
            <div className="flex items-center gap-2">
              <span className="font-bold text-dashYellow">$DASHC:</span>
              <CopyAddress
                address={dashcoinCA}
                truncate={true}
                displayLength={6}
                className="text-dashYellow-light hover:text-dashYellow"
              />
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <div className="text-center">
                <span className="text-xs opacity-70">Price</span>
                <p className="font-bold">${dashcPrice.toFixed(dashcPrice < 0.01 ? 8 : 6)}</p>
              </div>

              <div className="text-center">
                <span className="text-xs opacity-70">Market Cap</span>
                <p className="font-bold">{formatCurrency(dashcMarketCap)}</p>
              </div>

              <div className="text-center">
                <span className="text-xs opacity-70">24h Volume</span>
                <p className="font-bold">{formatCurrency(dashcVolume)}</p>
              </div>

              <div className="text-center">
                <span className="text-xs opacity-70">24h Change</span>
                <p
                  className={`font-bold ${
                    dashcChange24h >= 0 ? "text-dashGreen-accent" : "text-dashRed"
                  }`}
                >
                  {dashcChange24h >= 0 ? "+" : ""}
                  {dashcChange24h.toFixed(2)}%
                </p>
              </div>

              <div className="text-center">
                <span className="text-xs opacity-70">Liquidity</span>
                <p className="font-bold">{formatCurrency(dashcLiquidity)}</p>
              </div>
            </div>

            <div>
              <a
                href={dashcoinTradeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-dashYellow text-dashBlack font-medium rounded-md hover:bg-dashYellow-dark transition-colors text-sm flex items-center justify-center border border-dashBlack"
              >
                TRADE
              </a>
            </div>
          </div>
        </div>

        {/* Token Table */}
        <div className="mt-8">
          <h2 className="dashcoin-text text-3xl text-dashYellow mb-4">
            Top Tokens by Market Cap
          </h2>
          <Suspense
            fallback={
              <DashcoinCard className="p-8 flex items-center justify-center">
                <p className="text-center">
                  Loading token data... This may take a moment as we fetch data for the
                  top tokens.
                </p>
              </DashcoinCard>
            }
          >
            <TokenTableWrapper tokenDataPromise={tokenDataPromise} />
          </Suspense>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <DashcoinCard className="flex flex-col items-center justify-center py-8">
            <DashcoinCardHeader>
              <DashcoinCardTitle>Total Market Cap</DashcoinCardTitle>
            </DashcoinCardHeader>
            <DashcoinCardContent className="text-center">
              <p className="dashcoin-text text-4xl text-dashYellow">{formattedMarketCap}</p>
              <p className="text-sm opacity-80 mt-2">
                Last updated:{" "}
                {totalMarketCap && totalMarketCap.latest_data_at
                  ? new Date(totalMarketCap.latest_data_at).toLocaleString()
                  : "N/A"}
              </p>
              <DuneQueryLink queryId={5140151} className="mt-2 justify-center" />
            </DashcoinCardContent>
          </DashcoinCard>

          <DashcoinCard className="flex flex-col items-center justify-center py-8">
            <DashcoinCardHeader>
              <DashcoinCardTitle>Coin Launches</DashcoinCardTitle>
            </DashcoinCardHeader>
            <DashcoinCardContent className="text-center">
              <p className="dashcoin-text text-4xl text-dashYellow">{formattedCoinLaunches}</p>
              <p className="text-sm opacity-80 mt-2">Total coins tracked</p>
              <DuneQueryLink queryId={5140151} className="mt-2 justify-center" />
            </DashcoinCardContent>
          </DashcoinCard>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DashcoinCard>
            <DashcoinCardHeader>
              <DashcoinCardTitle>Market Cap</DashcoinCardTitle>
            </DashcoinCardHeader>
            <DashcoinCardContent>
              <p className="dashcoin-text text-3xl text-dashYellow">{formattedMarketCap}</p>
              <div className="mt-2 pt-2 border-t border-dashGreen-light opacity-50">
                <p className="text-sm">From Dune Analytics</p>
              </div>
              <DashcoinCacheStatus
                lastUpdated={formattedLastRefresh}
                nextUpdate={formattedNextRefresh}
                hoursRemaining={hoursUntilRefresh}
                minutesRemaining={minutesUntilRefresh}
              />
              <DuneQueryLink queryId={5140151} className="mt-2" />
            </DashcoinCardContent>
          </DashcoinCard>

          <DashcoinCard>
            <DashcoinCardHeader>
              <DashcoinCardTitle>24h Volume</DashcoinCardTitle>
            </DashcoinCardHeader>
            <DashcoinCardContent>
              <p className="dashcoin-text text-3xl text-dashYellow">{formattedVolume}</p>
              <div className="mt-2 pt-2 border-t border-dashGreen-light opacity-50">
                <p className="text-sm">From Dune Analytics</p>
              </div>
              <DuneQueryLink queryId={5140151} className="mt-2" />
            </DashcoinCardContent>
          </DashcoinCard>

          <DashcoinCard>
            <DashcoinCardHeader>
              <DashcoinCardTitle>Fee Earnings</DashcoinCardTitle>
            </DashcoinCardHeader>
            <DashcoinCardContent>
              <p className="dashcoin-text text-3xl text-dashYellow">
                {formattedFeeEarnings}
              </p>
              <div className="mt-2 pt-2 border-t border-dashGreen-light opacity-50">
                <p className="text-sm">Estimated at 0.3% of volume</p>
              </div>
              <DuneQueryLink queryId={5140151} className="mt-2" />
            </DashcoinCardContent>
          </DashcoinCard>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Suspense
            fallback={
              <DashcoinCard className="h-80 flex items-center justify-center">
                <p>Loading chart...</p>
              </DashcoinCard>
            }
          >
            <MarketCapChartWrapper marketCapTimeDataPromise={marketCapTimeDataPromise} />
          </Suspense>
          <Suspense
            fallback={
              <DashcoinCard className="h-80 flex items-center justify-center">
                <p>Loading chart...</p>
              </DashcoinCard>
            }
          >
            <MarketCapPieWrapper tokenMarketCapsPromise={tokenMarketCapsPromise} />
          </Suspense>
        </div>

        
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