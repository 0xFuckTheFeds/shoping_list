// app/research/page.tsx
import { Navbar } from "@/components/navbar";
import { DashcoinCard, DashcoinCardContent, DashcoinCardHeader, DashcoinCardTitle } from "@/components/ui/dashcoin-card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Twitter, Search, Calendar, User, Clock } from "lucide-react";
import { DashcoinLogo } from "@/components/dashcoin-logo";

// Interface for research post
interface ResearchPost {
  id: string;
  author: string;
  authorImage: string;
  title: string;
  content: string;
  publishDate: string;
  imageUrl?: string;
}

// Mock data for research posts
const researchPosts: ResearchPost[] = [
  {
    id: "1",
    author: "Crypto Frog",
    authorImage: "/images/frog-soldier.png",
    title: "The Rise of Dashcoin: A Comprehensive Analysis",
    content: `
      <p>Dashcoin has been making waves in the cryptocurrency market since its inception. In this comprehensive analysis, we'll explore the unique value proposition of Dashcoin and why it continues to gain traction among investors and traders alike.</p>
      
      <h3>Key Metrics</h3>
      <p>Looking at the current market metrics, Dashcoin has shown remarkable resilience even during market downturns. With a growing market cap and increasing liquidity, it has positioned itself as a serious contender in the meme coin space.</p>
      
      <h3>Technical Analysis</h3>
      <p>From a technical perspective, Dashcoin's architecture provides several advantages over traditional cryptocurrencies. Its innovative consensus mechanism allows for faster transaction speeds while maintaining security and decentralization.</p>
      
      <h3>Market Outlook</h3>
      <p>As we look ahead, several factors suggest Dashcoin may continue its upward trajectory. Increasing institutional interest, growing retail adoption, and the team's commitment to ongoing development all point to a bright future for DASHC holders.</p>
    `,
    publishDate: "May 10, 2025",
    imageUrl: "/images/research-dashcoin.jpg"
  },
  {
    id: "2",
    author: "Believe Analysis",
    authorImage: "/images/analyst-profile.jpg",
    title: "Comparative Analysis: Dashcoin vs Other Meme Tokens",
    content: `
      <p>In this detailed comparison, we examine how Dashcoin stacks up against other prominent meme tokens in the cryptocurrency ecosystem. Our analysis covers market performance, community engagement, and long-term viability factors.</p>
      
      <h3>Market Performance</h3>
      <p>When comparing year-to-date returns, Dashcoin has outperformed many of its peers, showing less volatility while maintaining competitive growth rates. This suggests a more mature holder base and potentially more sustainable tokenomics.</p>
      
      <h3>Community Strength</h3>
      <p>A key differentiator for Dashcoin has been its vibrant and engaged community. With active social media channels and frequent community events, DASHC has cultivated a loyal following that contributes to its market resilience.</p>
      
      <h3>Future Potential</h3>
      <p>Based on development roadmaps and strategic partnerships, Dashcoin appears positioned for continued growth. While other meme tokens often lack clear utility, DASHC's team has outlined several use cases that could drive adoption beyond speculative interest.</p>
    `,
    publishDate: "May 5, 2025",
    imageUrl: "/images/comparative-analysis.jpg"
  },
  {
    id: "3",
    author: "Crypto Frog",
    authorImage: "/images/frog-soldier.png",
    title: "Liquidity Analysis: Understanding Dashcoin's Market Depth",
    content: `
      <p>Liquidity is a crucial factor in assessing a cryptocurrency's market health. In this research piece, we delve into Dashcoin's liquidity metrics and what they tell us about the token's trading dynamics.</p>
      
      <h3>Liquidity Providers</h3>
      <p>One of Dashcoin's strengths has been its ability to attract and retain significant liquidity providers. This has resulted in lower slippage for traders and a more stable price discovery process compared to tokens with similar market capitalization.</p>
      
      <h3>Exchange Distribution</h3>
      <p>DASHC has achieved impressive exchange distribution in a relatively short time, being listed on multiple centralized and decentralized exchanges. This wide availability reduces single points of failure and makes the token accessible to a broader audience.</p>
      
      <h3>Trading Volumes</h3>
      <p>Analyzing the 24-hour to 7-day volume ratios shows healthy trading patterns without concerning spikes or drop-offs that might indicate market manipulation. This suggests organic interest and trading activity around the token.</p>
    `,
    publishDate: "April 29, 2025"
  }
];

export default function ResearchPage() {
  // Dashcoin trade link (used for navbar)
  const dashcoinTradeLink = "https://axiom.trade/t/fRfKGCriduzDwSudCwpL7ySCEiboNuryhZDVJtr1a1C/dashc";
  // Dashcoin X (Twitter) link
  const dashcoinXLink = "https://x.com/dune_dashcoin";

  return (
    <div className="min-h-screen">
      <Navbar dashcoinTradeLink={dashcoinTradeLink} />

      <main className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="dashcoin-title text-4xl md:text-5xl text-dashYellow mb-4">DASHCOIN RESEARCH</h1>
          <p className="text-xl max-w-3xl">In-depth analysis and insights into Dashcoin and the broader cryptocurrency market</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Post List */}
          <div className="lg:w-1/4">
            <DashcoinCard className="sticky top-24">
              <DashcoinCardHeader>
                <DashcoinCardTitle>Research Posts</DashcoinCardTitle>
                <div className="relative mt-4">
                  <input 
                    type="text" 
                    placeholder="Search posts..." 
                    className="w-full px-4 py-2 rounded-md bg-dashGreen-dark border border-dashGreen-light focus:border-dashYellow focus:outline-none"
                  />
                  <Search className="absolute right-3 top-2.5 h-5 w-5 text-dashYellow-light" />
                </div>
              </DashcoinCardHeader>
              <DashcoinCardContent>
                <div className="space-y-4">
                  {researchPosts.map((post) => (
                    <div key={post.id} className="p-3 rounded-md hover:bg-dashGreen-dark cursor-pointer border border-transparent hover:border-dashGreen-light">
                      <h3 className="font-medium text-dashYellow-light">{post.title}</h3>
                      <div className="flex items-center gap-2 mt-2 text-sm opacity-70">
                        <User className="h-3 w-3" />
                        <span>{post.author}</span>
                        <span>•</span>
                        <Clock className="h-3 w-3" />
                        <span>{post.publishDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </DashcoinCardContent>
            </DashcoinCard>
          </div>

          {/* Main Content - Blog Posts */}
          <div className="lg:w-3/4">
            <div className="space-y-12">
              {researchPosts.map((post) => (
                <DashcoinCard key={post.id} className="overflow-hidden">
                  {post.imageUrl && (
                    <div className="h-64 w-full relative">
                      <div className="absolute inset-0 bg-dashGreen-dark flex items-center justify-center">
                        <p className="text-dashYellow">Image: {post.title}</p>
                      </div>
                    </div>
                  )}
                  <DashcoinCardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-full overflow-hidden relative bg-dashGreen-dark">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs text-dashYellow">{post.author[0]}</span>
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">{post.author}</p>
                        <p className="text-sm opacity-70">{post.publishDate}</p>
                      </div>
                    </div>
                    <DashcoinCardTitle className="text-2xl md:text-3xl">{post.title}</DashcoinCardTitle>
                  </DashcoinCardHeader>
                  <DashcoinCardContent>
                    <div 
                      className="prose prose-invert max-w-none prose-headings:text-dashYellow prose-a:text-dashYellow-light"
                      dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                  </DashcoinCardContent>
                </DashcoinCard>
              ))}
            </div>

            {/* Post Submission Form */}
            <DashcoinCard className="mt-12">
              <DashcoinCardHeader>
                <DashcoinCardTitle>Submit New Research</DashcoinCardTitle>
              </DashcoinCardHeader>
              <DashcoinCardContent>
                <form className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block mb-2 text-sm font-medium">Your Name</label>
                    <input 
                      type="text" 
                      id="name" 
                      className="w-full px-4 py-2 rounded-md bg-dashGreen-dark border border-dashGreen-light focus:border-dashYellow focus:outline-none"
                      placeholder="Enter your name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="image" className="block mb-2 text-sm font-medium">Profile Image</label>
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-dashGreen-dark flex items-center justify-center border border-dashGreen-light">
                        <span className="text-dashYellow opacity-70">Image</span>
                      </div>
                      <Button className="bg-dashYellow text-dashBlack hover:bg-dashYellow-dark">Upload</Button>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="title" className="block mb-2 text-sm font-medium">Research Title</label>
                    <input 
                      type="text" 
                      id="title" 
                      className="w-full px-4 py-2 rounded-md bg-dashGreen-dark border border-dashGreen-light focus:border-dashYellow focus:outline-none"
                      placeholder="Enter research title"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="content" className="block mb-2 text-sm font-medium">Research Content</label>
                    <textarea 
                      id="content" 
                      rows={10}
                      className="w-full px-4 py-2 rounded-md bg-dashGreen-dark border border-dashGreen-light focus:border-dashYellow focus:outline-none"
                      placeholder="Write your research content here..."
                    ></textarea>
                  </div>
                  
                  <div>
                    <label htmlFor="image" className="block mb-2 text-sm font-medium">Featured Image (Optional)</label>
                    <div className="border-2 border-dashed border-dashGreen-light rounded-md p-8 text-center">
                      <p className="mb-4 opacity-70">Drag and drop an image here, or click to select</p>
                      <Button className="bg-dashYellow text-dashBlack hover:bg-dashYellow-dark">Upload Image</Button>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-dashYellow text-dashBlack hover:bg-dashYellow-dark text-lg py-6">
                    Submit Research
                  </Button>
                </form>
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