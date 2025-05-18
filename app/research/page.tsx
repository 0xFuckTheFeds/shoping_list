"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { DashcoinCard, DashcoinCardContent, DashcoinCardHeader, DashcoinCardTitle } from "@/components/ui/dashcoin-card";
import { Twitter, Search, Calendar, Clock, Hexagon, BookOpen, ArrowRight } from "lucide-react";
import { DashcoinLogo } from "@/components/dashcoin-logo";
import { researchPosts } from "@/data/research-data";

// Add global styles for custom scrollbar
const globalStyles = `
  /* Hide scrollbar for Chrome, Safari and Opera */
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  
  /* Hide scrollbar for IE, Edge and Firefox */
  .no-scrollbar {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
`;

export default function ResearchPage() {
  // Dashcoin trade link (used for navbar)
  const dashcoinTradeLink = "https://axiom.trade/t/fRfKGCriduzDwSudCwpL7ySCEiboNuryhZDVJtr1a1C/dashc";
  // Dashcoin X (Twitter) link
  const dashcoinXLink = "https://x.com/dune_dashcoin";
  
  // Client-side state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPostId, setSelectedPostId] = useState("1");
  
  // Function to filter posts based on search query
  const filteredPosts = researchPosts.filter((post) => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.coinName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Get the selected post
  const selectedPost = researchPosts.find((post) => post.id === selectedPostId) || researchPosts[0];

  // Select a post from sidebar
  const handleSelectPost = (id: string) => {
    setSelectedPostId(id);
    // Optional: Scroll to top of article content when new post is selected
    document.getElementById('content-top')?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Effect to set the height of the sidebar container on initial load and window resize
  useEffect(() => {
    const setContainerHeights = () => {
      const viewportHeight = window.innerHeight;
      const navbarHeight = document.querySelector('nav')?.offsetHeight || 0;
      const headerHeight = document.querySelector('.dashcoin-title')?.parentElement?.offsetHeight || 0;
      const footerHeight = document.querySelector('footer')?.offsetHeight || 0;
      
      const availableHeight = viewportHeight - navbarHeight - headerHeight - footerHeight - 48; // 48px for padding
      
      // Set the height ONLY for the sidebar content container
      document.querySelectorAll('.sidebar-content-container').forEach((el) => {
        (el as HTMLElement).style.height = `${availableHeight}px`;
      });
    };
    
    setContainerHeights();
    window.addEventListener('resize', setContainerHeights);
    
    return () => {
      window.removeEventListener('resize', setContainerHeights);
    };
  }, []);

  return (
    <div className="min-h-screen bg-dashGreen-darkest relative overflow-x-hidden">
      <style jsx global>{globalStyles}</style>
      
      <div className="absolute top-20 left-10 opacity-5 transform rotate-45">
        <Hexagon size={300} />
      </div>
      <div className="absolute bottom-40 right-0 opacity-5 transform -rotate-15">
        <Hexagon size={400} />
      </div>
      
      <Navbar dashcoinTradeLink={dashcoinTradeLink} />

      <main className="container mx-auto px-4 py-6 relative z-10">
        <div className="mb-8 w-full relative">
          <div className="absolute -top-8 -left-4 w-20 h-20 bg-dashYellow opacity-10 rounded-full blur-xl"></div>
          <div className="absolute top-10 right-20 w-32 h-32 bg-dashGreen-light opacity-5 rounded-full blur-xl"></div>
          
          <h1 className="dashcoin-title text-4xl md:text-6xl text-dashYellow mb-4 relative inline-block">
            DASHCOIN RESEARCH
            <span className="absolute -bottom-2 left-0 w-20 h-1 bg-dashYellow"></span>
          </h1>
        </div>

        <div className="flex flex-col justify-center items-start lg:flex-row gap-8">
          {/* Sidebar - Research Directory */} 
          <div className="lg:w-1/4 w-full">
            <DashcoinCard className="sidebar-content-container overflow-hidden transition-all duration-300 hover:shadow-[0_0_15px_rgba(234,179,8,0.05)]">
              <DashcoinCardHeader className="sticky top-0 bg-dashGreen-darkest z-10">
                <DashcoinCardTitle className="flex items-center ">
                  <BookOpen className="h-5 w-5 mr-2 text-dashYellow" />
                  Research Directory
                  <div className="ml-2 h-3 w-3 rounded-full bg-dashYellow animate-pulse"></div>
                </DashcoinCardTitle>
                <div className="relative mt-4 group">
                  <input 
                    type="text" 
                    placeholder="Search" 
                    className="w-full px-4 py-2 rounded-md bg-dashGreen-dark border border-dashGreen-light focus:border-dashYellow focus:outline-none transition-all duration-300 group-hover:border-dashYellow-light"
                    onChange={(e) => setSearchQuery(e.target.value)}
                    value={searchQuery}
                  />
                  <Search className="absolute right-3 top-2.5 h-5 w-5 text-dashYellow-light" />
                </div>
              </DashcoinCardHeader>
              <DashcoinCardContent className="h-full overflow-y-auto no-scrollbar">
                <div className="space-y-4 pr-2">
                  {filteredPosts.map((post) => (
                    <div 
                      key={post.id} 
                      className={`p-3 rounded-md cursor-pointer border transition-all duration-300 transform hover:scale-[1.02] 
                        ${post.id === selectedPostId 
                          ? 'border-dashYellow bg-dashGreen-dark shadow-[0_0_10px_rgba(234,179,8,0.1)]' 
                          : 'border-transparent hover:border-dashGreen-light hover:bg-dashGreen-dark/50'}`}
                      onClick={() => handleSelectPost(post.id)}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-dashYellow-light">{post.coinName}</h3>
                        {post.id === selectedPostId && (
                          <div className="h-2 w-2 rounded-full bg-dashYellow"></div>
                        )}
                      </div>
                      <p className="text-sm mt-1 line-clamp-2 opacity-80">{post.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 text-xs opacity-70">
                          <Calendar className="h-3 w-3" />
                          <span>{post.publishDate}</span>
                        </div>
                        {post.id === selectedPostId && (
                          <ArrowRight className="h-3 w-3 text-dashYellow" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </DashcoinCardContent>
            </DashcoinCard>
          </div>

          {/* Main Content - Research Viewer */} 
          <div className="lg:w-3/4 w-full" id="content-top">
            <DashcoinCard className="transition-all duration-300 hover:shadow-[0_0_15px_rgba(234,179,8,0.05)] relative">
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-dashYellow/30 to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-dashYellow/30 via-transparent to-dashYellow/30"></div>
              
              <div className="flex flex-col">
                <DashcoinCardHeader className="flex justify-between items-start border-b border-dashGreen-light pb-4 flex-shrink-0">
                  <div className="flex flex-col flex-grow mr-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-full overflow-hidden relative bg-dashGreen-dark border border-dashYellow/20 flex items-center justify-center shadow-lg">
                        <span className="text-xl font-bold text-dashYellow">{selectedPost.author[0]}</span>
                      </div>
                      <div>
                        <p className="font-medium">{selectedPost.author}</p>
                        <div className="flex items-center gap-1 text-sm opacity-70">
                          <Clock className="h-3 w-3" />
                          <span>{selectedPost.publishDate}</span>
                        </div>
                      </div>
                    </div>
                    <DashcoinCardTitle className="text-2xl md:text-3xl relative">
                      {selectedPost.title}
                      <span className="absolute -bottom-2 left-0 w-16 h-0.5 bg-dashYellow/50"></span>
                    </DashcoinCardTitle>
                    <p className="text-dashYellow-light mt-2 text-lg">
                      {selectedPost.coinName}
                    </p>
                  </div>
                  
                  {selectedPost.imageUrl && (
                    <div className="flex-shrink-0 w-32 h-32 overflow-hidden rounded-lg border border-dashYellow/20">
                      <div className="relative w-full h-full bg-dashGreen-dark flex items-center justify-center hover:scale-105 transition-transform duration-500">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dashGreen-darkest opacity-50"></div>
                        <p className="text-dashYellow relative z-10 font-bold dashcoin-text text-sm text-center">
                          {selectedPost.coinName}
                        </p>
                      </div>
                    </div>
                  )}
                </DashcoinCardHeader>
                
                <DashcoinCardContent className="no-scrollbar flex flex-col py-4">
                  <div 
                    className="prose prose-invert max-w-none prose-headings:text-dashYellow prose-a:text-dashYellow-light prose-img:rounded-lg prose-img:my-8 prose-img:shadow-lg flex-grow"
                    dangerouslySetInnerHTML={{ 
                      __html: selectedPost.content 
                    }}
                  />
                </DashcoinCardContent>
              </div>
            </DashcoinCard>
          </div>
        </div>
      </main>

      <footer className="container mx-auto py-6 px-4 border-t border-dashGreen-light">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <DashcoinLogo size={32} />
            <span className="text-dashYellow-light font-bold">DASHCOIN RESEARCH</span>
          </div>
          <p className="text-sm opacity-80">© 2025 Dashcoin. All rights reserved.</p>
          <a
            href={dashcoinXLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-dashYellow hover:text-dashYellow-dark transition-colors px-4 py-2 border border-dashYellow rounded-md hover:bg-dashYellow/10 transition-all duration-300"
          >
            <Twitter className="h-5 w-5" />
            <span className="dashcoin-text">Follow on X</span>
          </a>
        </div>
      </footer>
    </div>
  );
}