// app/research/page.tsx
import { Navbar } from "@/components/navbar";
import { DashcoinCard, DashcoinCardContent, DashcoinCardHeader, DashcoinCardTitle } from "@/components/ui/dashcoin-card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Twitter, Search, Calendar, User, Clock } from "lucide-react";
import { DashcoinLogo } from "@/components/dashcoin-logo";
import { useState } from "react";

// Interface for research post
interface ResearchPost {
  id: string;
  author: string;
  authorImage: string;
  title: string;
  content: string;
  publishDate: string;
  imageUrl?: string;
  coinName: string; // Added coin name
  description: string; // Added short description
}

// Mock data for research posts with added fields
const researchPosts: ResearchPost[] = [
  {
    id: "1",
    author: "Crypto Frog",
    authorImage: "/images/frog-soldier.png",
    title: "The Rise of Dashcoin: A Comprehensive Analysis",
    coinName: "DASHC",
    description: "An in-depth analysis of Dashcoin's market position and future potential",
    content: `
      <p>Dashcoin has been making waves in the cryptocurrency market since its inception. In this comprehensive analysis, we'll explore the unique value proposition of Dashcoin and why it continues to gain traction among investors and traders alike.</p>
      
      <h3>Key Metrics</h3>
      <p>Looking at the current market metrics, Dashcoin has shown remarkable resilience even during market downturns. With a growing market cap and increasing liquidity, it has positioned itself as a serious contender in the meme coin space.</p>
      
      <h3>Technical Analysis</h3>
      <p>From a technical perspective, Dashcoin's architecture provides several advantages over traditional cryptocurrencies. Its innovative consensus mechanism allows for faster transaction speeds while maintaining security and decentralization.</p>
      
      <h3>Market Outlook</h3>
      <p>As we look ahead, several factors suggest Dashcoin may continue its upward trajectory. Increasing institutional interest, growing retail adoption, and the team's commitment to ongoing development all point to a bright future for DASHC holders.</p>
      
      <img src="/api/placeholder/800/400" alt="Dashcoin price chart" />
      
      <p>The chart above shows Dashcoin's price performance over the last 3 months, demonstrating consistent growth despite market volatility.</p>
    `,
    publishDate: "May 10, 2025",
    imageUrl: "/images/research-dashcoin.jpg"
  },
  {
    id: "2",
    author: "Believe Analysis",
    authorImage: "/images/analyst-profile.jpg",
    title: "Comparative Analysis: Dashcoin vs Other Meme Tokens",
    coinName: "DASHC/DOGE/SHIB",
    description: "A comparative study of leading meme coins and their market performance",
    content: `
      <p>In this detailed comparison, we examine how Dashcoin stacks up against other prominent meme tokens in the cryptocurrency ecosystem. Our analysis covers market performance, community engagement, and long-term viability factors.</p>
      
      <h3>Market Performance</h3>
      <p>When comparing year-to-date returns, Dashcoin has outperformed many of its peers, showing less volatility while maintaining competitive growth rates. This suggests a more mature holder base and potentially more sustainable tokenomics.</p>
      
      <h3>Community Strength</h3>
      <p>A key differentiator for Dashcoin has been its vibrant and engaged community. With active social media channels and frequent community events, DASHC has cultivated a loyal following that contributes to its market resilience.</p>
      
      <img src="/api/placeholder/800/400" alt="Community engagement comparison" />
      
      <h3>Future Potential</h3>
      <p>Based on development roadmaps and strategic partnerships, Dashcoin appears positioned for continued growth. While other meme tokens often lack clear utility, DASHC's team has outlined several use cases that could drive adoption beyond speculative interest.</p>
      
      <p>For more information on other meme coins, visit <a href="https://cryptoanalysis.com/memecoins" target="_blank" rel="noopener noreferrer">Crypto Analysis</a>.</p>
    `,
    publishDate: "May 5, 2025",
    imageUrl: "/images/comparative-analysis.jpg"
  },
  {
    id: "3",
    author: "Crypto Frog",
    authorImage: "/images/frog-soldier.png",
    title: "Liquidity Analysis: Understanding Dashcoin's Market Depth",
    coinName: "DASHC",
    description: "Deep dive into liquidity metrics and trading dynamics",
    content: `
      <p>Liquidity is a crucial factor in assessing a cryptocurrency's market health. In this research piece, we delve into Dashcoin's liquidity metrics and what they tell us about the token's trading dynamics.</p>
      
      <h3>Liquidity Providers</h3>
      <p>One of Dashcoin's strengths has been its ability to attract and retain significant liquidity providers. This has resulted in lower slippage for traders and a more stable price discovery process compared to tokens with similar market capitalization.</p>
      
      <h3>Exchange Distribution</h3>
      <p>DASHC has achieved impressive exchange distribution in a relatively short time, being listed on multiple centralized and decentralized exchanges. This wide availability reduces single points of failure and makes the token accessible to a broader audience.</p>
      
      <img src="/api/placeholder/800/400" alt="Exchange distribution chart" />
      
      <h3>Trading Volumes</h3>
      <p>Analyzing the 24-hour to 7-day volume ratios shows healthy trading patterns without concerning spikes or drop-offs that might indicate market manipulation. This suggests organic interest and trading activity around the token.</p>
    `,
    publishDate: "April 29, 2025"
  },
  {
    id: "4",
    author: "Blockchain Insights",
    authorImage: "/images/blockchain-insights.jpg",
    title: "Emerging NFT Use Cases in the Dashcoin Ecosystem",
    coinName: "DASHC/NFT",
    description: "Exploring innovative NFT implementations within Dashcoin",
    content: `
      <p>Non-fungible tokens (NFTs) have become an integral part of many cryptocurrency ecosystems. This research explores how Dashcoin is integrating NFT functionality and the unique use cases being developed.</p>
      
      <h3>Dashcoin NFT Platform</h3>
      <p>The recently launched Dashcoin NFT platform provides a streamlined experience for creators and collectors. With lower fees than many competitors and seamless integration with the DASHC token, it offers a compelling alternative in the NFT space.</p>
      
      <img src="/api/placeholder/800/400" alt="Dashcoin NFT Platform UI" />
      
      <h3>Community Governance NFTs</h3>
      <p>One of the most innovative applications has been the introduction of governance NFTs, which grant holders voting rights in community decisions. This approach has introduced a new paradigm for decentralized governance that balances influence with commitment to the ecosystem.</p>
      
      <h3>Future Developments</h3>
      <p>Looking ahead, the Dashcoin team has outlined plans for NFT staking, fractional ownership, and cross-chain NFT functionality. These developments could position Dashcoin as a leader in the evolving NFT landscape.</p>
    `,
    publishDate: "April 22, 2025",
    imageUrl: "/images/nft-ecosystem.jpg"
  },
  {
    id: "5",
    author: "DeFi Explorer",
    authorImage: "/images/defi-explorer.jpg",
    title: "Dashcoin's Role in Decentralized Finance",
    coinName: "DASHC/DeFi",
    description: "Analysis of Dashcoin's integration with DeFi protocols",
    content: `
      <p>Decentralized Finance (DeFi) continues to revolutionize financial services. This report examines Dashcoin's growing presence in the DeFi space and its potential impact on token value and utility.</p>
      
      <h3>Lending and Borrowing</h3>
      <p>Several major DeFi platforms have recently added support for DASHC tokens, allowing holders to earn interest by supplying liquidity or to use their tokens as collateral for loans. This integration has opened new utility avenues for DASHC holders.</p>
      
      <h3>Yield Farming Opportunities</h3>
      <p>The introduction of DASHC liquidity pools has created attractive yield farming opportunities. Current APY rates on various platforms range from 15% to 40%, depending on the specific pool and platform.</p>
      
      <img src="/api/placeholder/800/400" alt="DeFi yield comparison chart" />
      
      <h3>Risk Assessment</h3>
      <p>While the DeFi integration offers new opportunities, it's important to consider the associated risks, including smart contract vulnerabilities, impermanent loss, and market volatility. We provide a balanced analysis of these factors to help investors make informed decisions.</p>
      
      <p>For more information on DeFi security best practices, visit <a href="https://defiexplorer.io/security" target="_blank" rel="noopener noreferrer">DeFi Explorer</a>.</p>
    `,
    publishDate: "April 15, 2025",
    imageUrl: "/images/defi-integration.jpg"
  }
];

export default function ResearchPage() {
  // Dashcoin trade link (used for navbar)
  const dashcoinTradeLink = "https://axiom.trade/t/fRfKGCriduzDwSudCwpL7ySCEiboNuryhZDVJtr1a1C/dashc";
  // Dashcoin X (Twitter) link
  const dashcoinXLink = "https://x.com/dune_dashcoin";
  
  // Client-side state (will only work with proper Client Components setup)
  // For now, using "use client" at the top of your file or moving this to a client component
  // const [searchQuery, setSearchQuery] = useState("");
  // const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  
  // For SSR, we'll just use a default selected post
  const selectedPostId = "1";
  
  // Function to filter posts based on search query (to be used client-side)
  const filteredPosts = researchPosts; // This would be: researchPosts.filter(post => post.coinName.toLowerCase().includes(searchQuery.toLowerCase()));
  
  // Get the selected post
  const selectedPost = researchPosts.find(post => post.id === selectedPostId) || researchPosts[0];

  return (
    <div className="min-h-screen">
      <Navbar dashcoinTradeLink={dashcoinTradeLink} />

      <main className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="dashcoin-title text-4xl md:text-5xl text-dashYellow mb-4">DASHCOIN RESEARCH</h1>
          <p className="text-xl max-w-3xl">In-depth analysis and insights into Dashcoin and the broader cryptocurrency market</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Research Directory */}
          <div className="lg:w-1/4">
            <DashcoinCard className="sticky top-24">
              <DashcoinCardHeader>
                <DashcoinCardTitle>Research Directory</DashcoinCardTitle>
                <div className="relative mt-4">
                  <input 
                    type="text" 
                    placeholder="Search coins..." 
                    className="w-full px-4 py-2 rounded-md bg-dashGreen-dark border border-dashGreen-light focus:border-dashYellow focus:outline-none"
                    // onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute right-3 top-2.5 h-5 w-5 text-dashYellow-light" />
                </div>
              </DashcoinCardHeader>
              <DashcoinCardContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {filteredPosts.map((post) => (
                    <div 
                      key={post.id} 
                      className={`p-3 rounded-md hover:bg-dashGreen-dark cursor-pointer border ${post.id === selectedPostId ? 'border-dashYellow bg-dashGreen-dark' : 'border-transparent hover:border-dashGreen-light'}`}
                      // onClick={() => setSelectedPostId(post.id)}
                    >
                      <h3 className="font-medium text-dashYellow-light">{post.coinName}</h3>
                      <p className="text-sm mt-1 line-clamp-2 opacity-80">{post.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-sm opacity-70">
                        <Calendar className="h-3 w-3" />
                        <span>{post.publishDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </DashcoinCardContent>
            </DashcoinCard>
          </div>

          {/* Main Content - Research Viewer */}
          <div className="lg:w-3/4">
            <DashcoinCard className="overflow-hidden">
              {selectedPost.imageUrl && (
                <div className="h-64 w-full relative">
                  <div className="absolute inset-0 bg-dashGreen-dark flex items-center justify-center">
                    <p className="text-dashYellow">Image: {selectedPost.title}</p>
                  </div>
                </div>
              )}
              <DashcoinCardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full overflow-hidden relative bg-dashGreen-dark">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-dashYellow">{selectedPost.author[0]}</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">{selectedPost.author}</p>
                    <p className="text-sm opacity-70">{selectedPost.publishDate}</p>
                  </div>
                </div>
                <DashcoinCardTitle className="text-2xl md:text-3xl">{selectedPost.title}</DashcoinCardTitle>
              </DashcoinCardHeader>
              <DashcoinCardContent>
                <div 
                  className="prose prose-invert max-w-none prose-headings:text-dashYellow prose-a:text-dashYellow-light prose-img:rounded-lg prose-img:my-8"
                  dangerouslySetInnerHTML={{ __html: selectedPost.content }}
                />
              </DashcoinCardContent>
            </DashcoinCard>
          </div>
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