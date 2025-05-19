"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { DashcoinCard, DashcoinCardContent, DashcoinCardHeader, DashcoinCardTitle } from "@/components/ui/dashcoin-card";
import { Twitter, Search, Calendar, Clock, Hexagon, BookOpen, ArrowRight, Upload, FileText, X } from "lucide-react";
import { DashcoinLogo } from "@/components/dashcoin-logo";
import * as Papa from 'papaparse';
import * as mammoth from 'mammoth';

interface Article {
  id: string;
  title: string;
  coinName: string;
  description: string;
  author: string;
  publishDate: string;
  content: string;
  fileName: string;
}

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
  const dashcoinTradeLink = "https://axiom.trade/t/fRfKGCriduzDwSudCwpL7ySCEiboNuryhZDVJtr1a1C/dashc";
  const dashcoinXLink = "https://x.com/dune_dashcoin";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPostId, setSelectedPostId] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  const filteredPosts = articles.filter((article) => 
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.coinName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const selectedPost = selectedPostId ? 
    articles.find((article) => article.id === selectedPostId) : 
    articles.length > 0 ? articles[0] : null;
  
  useEffect(() => {
    if (articles.length > 0 && !selectedPostId) {
      setSelectedPostId(articles[0].id);
    }
  }, [articles, selectedPostId]);
  
  const handleSelectPost = (id: string) => {
    setSelectedPostId(id);
    document.getElementById('content-top')?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Resize container heights to match viewport
  useEffect(() => {
    const setContainerHeights = () => {
      const viewportHeight = window.innerHeight;
      const navbarHeight = document.querySelector('nav')?.offsetHeight || 0;
      const headerHeight = document.querySelector('.dashcoin-title')?.parentElement?.offsetHeight || 0;
      const footerHeight = document.querySelector('footer')?.offsetHeight || 0;
      const availableHeight = viewportHeight - navbarHeight - headerHeight - footerHeight - 48; 
      
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

  // Process the uploaded file
  const processFile = async (file: File) => {
    setIsUploading(true);
    setUploadError("");
    
    try {
      let parsedContent;
      
      // Process file based on type
      if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        // Handle Word documents with mammoth
        parsedContent = await processDocxFile(file);
      } else if (file.name.endsWith('.txt') || file.name.endsWith('.html') || file.name.endsWith('.md')) {
        // Handle text files
        const content = await readFileContent(file);
        parsedContent = parseTextContent(content, file.name);
      } else if (file.name.endsWith('.json')) {
        // Handle JSON files
        const content = await readFileContent(file);
        parsedContent = parseJsonContent(content);
      } else if (file.name.endsWith('.csv')) {
        // Handle CSV files
        const content = await readFileContent(file);
        parsedContent = parseCsvContent(content);
      } else {
        // Default to text parsing for other formats
        const content = await readFileContent(file);
        parsedContent = parseTextContent(content, file.name);
      }
      
      // Add the new article to the list
      setArticles(prevArticles => [...prevArticles, {
        ...parsedContent,
        id: Date.now().toString(), // Generate unique ID based on timestamp
        fileName: file.name,
        publishDate: new Date().toLocaleDateString()
      }]);
      
      setShowUploadModal(false);
      setIsUploading(false);
    } catch (error) {
      console.error("Error processing file:", error);
      setUploadError(`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the file format and try again.`);
      setIsUploading(false);
    }
  };
  
  // Process DOCX files
  const processDocxFile = async (file: File) => {
    return new Promise<any>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          
          // Convert DOCX to HTML using mammoth
          const result = await mammoth.convertToHtml({ arrayBuffer });
          const htmlContent = result.value;
          
          // Extract title from first heading or filename
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = htmlContent;
          
          // Try to find a heading
          const heading = tempDiv.querySelector('h1, h2, h3');
          const title = heading ? heading.textContent || '' : file.name.replace(/\.[^/.]+$/, "");
          
          // Extract text content for description
          const textContent = tempDiv.textContent || '';
          const description = textContent.substring(0, 150);
          
          // Try to find potential coin name (look for uppercase words or use filename)
          const coinNameMatch = textContent.match(/([A-Z]{3,})/);
          const coinName = coinNameMatch ? coinNameMatch[0] : file.name.replace(/\.[^/.]+$/, "").toUpperCase();
          
          resolve({
            title,
            coinName,
            description: description.trim(),
            author: 'DOCX Document',
            content: htmlContent
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsArrayBuffer(file);
    });
  };
  
  // Read file content as text
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target?.result as string);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsText(file);
    });
  };
  
  const parseTextContent = (content: string, fileName: string) => {
    // Extract title from first line or filename
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const title = lines.length > 0 ? lines[0].trim() : fileName.replace(/\.[^/.]+$/, "");
    
    // Extract potential coin name (look for uppercase words or use filename)
    const coinNameMatch = content.match(/([A-Z]{3,})/);
    const coinName = coinNameMatch ? coinNameMatch[0] : fileName.replace(/\.[^/.]+$/, "").toUpperCase();
    
    // Generate description from first paragraph or slice of content
    const firstParagraphEnd = content.indexOf('\n\n');
    const description = firstParagraphEnd > 0 
      ? content.slice(0, firstParagraphEnd).substring(0, 150) 
      : content.substring(0, 150);
    
    // Format the content with proper HTML
    const formattedContent = content
      .split('\n')
      .map(line => {
        if (line.trim() === '') return '<br>';
        if (line.trim().startsWith('#')) return `<h2>${line.replace(/^#+\s/, '')}</h2>`;
        if (line.trim().startsWith('##')) return `<h3>${line.replace(/^#+\s/, '')}</h3>`;
        return `<p>${line}</p>`;
      })
      .join('');
    
    return {
      title,
      coinName,
      description: description.replace(title, '').trim() || 'No description available',
      author: 'Uploaded Document',
      content: formattedContent
    };
  };
  
  // Parse JSON content
  const parseJsonContent = (content: string) => {
    try {
      const parsedJson = JSON.parse(content);
      
      return {
        title: parsedJson.title || parsedJson.name || 'Untitled Document',
        coinName: parsedJson.coinName || parsedJson.coin || parsedJson.symbol || 'UNKNOWN',
        description: parsedJson.description || parsedJson.summary || parsedJson.abstract || 'No description available',
        author: parsedJson.author || parsedJson.creator || 'Unknown Author',
        content: parsedJson.content || parsedJson.body || parsedJson.text || 'No content available'
      };
    } catch (error) {
      throw new Error("Invalid JSON format");
    }
  };
  
  const parseCsvContent = (content: string) => {
    try {
      const parsedCsv = Papa.parse(content, { header: true });
      const data = parsedCsv.data[0] || {};
      
      return {
        title: data.title || data.name || 'CSV Import',
        coinName: data.coinName || data.coin || data.symbol || 'CSV DATA',
        description: data.description || data.summary || 'Data imported from CSV file',
        author: data.author || 'CSV Import',
        content: '<h2>Data from CSV</h2>' + Object.entries(data)
          .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
          .join('')
      };
    } catch (error) {
      throw new Error("Invalid CSV format");
    }
  };
  
  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Delete an article
  const handleDeleteArticle = (id: string) => {
    setArticles(articles.filter(article => article.id !== id));
    if (selectedPostId === id) {
      setSelectedPostId(articles.length > 1 ? articles.find(a => a.id !== id)?.id || "" : "");
    }
  };
  
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
        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-dashGreen-dark p-6 rounded-lg w-full max-w-md border border-dashYellow/20">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-dashYellow">Upload Research Article</h2>
                <button 
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="border-2 border-dashed border-dashGreen-light rounded-lg p-6 text-center mb-4">
                <FileText className="mx-auto h-12 w-12 text-dashYellow-light mb-2" />
                <p className="mb-4">Drag & drop your document or click to browse</p>
                <input 
                  type="file" 
                  id="file-upload" 
                  className="hidden" 
                  onChange={handleFileUpload}
                  accept=".txt,.html,.md,.json,.csv,.doc,.docx"
                />
                <label 
                  htmlFor="file-upload" 
                  className="px-4 py-2 bg-dashGreen-light text-white rounded-md cursor-pointer hover:bg-dashYellow hover:text-dashGreen-darkest transition-colors"
                >
                  Select File
                </label>
                <p className="mt-2 text-sm text-gray-400">
                  Supported formats: TXT, HTML, MD, JSON, CSV, DOC, DOCX
                </p>
              </div>
              
              {uploadError && (
                <div className="bg-red-900/30 border border-red-500 text-red-200 p-3 rounded mb-4">
                  {uploadError}
                </div>
              )}
              
              {isUploading && (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-dashYellow"></div>
                  <span className="ml-2">Processing document...</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col justify-center items-start lg:flex-row gap-8">
          {/* Sidebar - Research Directory */} 
          <div className="lg:w-1/4 w-full">
            <DashcoinCard className="sidebar-content-container overflow-hidden transition-all duration-300 hover:shadow-[0_0_15px_rgba(234,179,8,0.05)]">
              <DashcoinCardHeader className="sticky top-0 bg-dashGreen-darkest z-10">
                <div className="flex justify-between items-center">
                  <DashcoinCardTitle className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-dashYellow" />
                    Research Directory
                    {articles.length > 0 && (
                      <div className="ml-2 h-3 w-3 rounded-full bg-dashYellow animate-pulse"></div>
                    )}
                  </DashcoinCardTitle>
                  <button 
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center gap-1 text-dashYellow hover:text-dashYellow-light transition-colors text-sm"
                  >
                    <Upload size={14} />
                    <span>Upload</span>
                  </button>
                </div>
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
                {articles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center h-64 text-gray-400">
                    <FileText className="h-12 w-12 mb-4 opacity-50" />
                    <p className="mb-2">No research articles yet</p>
                    <button 
                      onClick={() => setShowUploadModal(true)}
                      className="mt-2 px-4 py-2 bg-dashGreen-light rounded-md hover:bg-dashYellow hover:text-dashGreen-darkest transition-colors"
                    >
                      Upload Your First Article
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 pr-2">
                    {filteredPosts.map((article) => (
                      <div 
                        key={article.id} 
                        className={`p-3 rounded-md cursor-pointer border transition-all duration-300 transform hover:scale-[1.02] 
                          ${article.id === selectedPostId 
                            ? 'border-dashYellow bg-dashGreen-dark shadow-[0_0_10px_rgba(234,179,8,0.1)]' 
                            : 'border-transparent hover:border-dashGreen-light hover:bg-dashGreen-dark/50'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div 
                            className="flex-grow"
                            onClick={() => handleSelectPost(article.id)}
                          >
                            <h3 className="font-medium text-dashYellow-light">{article.coinName}</h3>
                            <p className="text-sm mt-1 line-clamp-2 opacity-80">{article.description}</p>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2 text-xs opacity-70">
                                <Calendar className="h-3 w-3" />
                                <span>{article.publishDate}</span>
                              </div>
                              {article.id === selectedPostId && (
                                <ArrowRight className="h-3 w-3 text-dashYellow" />
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteArticle(article.id);
                            }}
                            className="ml-2 p-1 text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete article"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </DashcoinCardContent>
            </DashcoinCard>
          </div>

          {/* Main Content - Research Viewer */} 
          <div className="lg:w-3/4 w-full" id="content-top">
            {selectedPost ? (
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
                            <span className="ml-2 px-2 py-0.5 bg-dashGreen-light rounded-full text-xs">
                              {selectedPost.fileName}
                            </span>
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
                    
                    <div className="flex-shrink-0 w-32 h-32 overflow-hidden rounded-lg border border-dashYellow/20">
                      <div className="relative w-full h-full bg-dashGreen-dark flex items-center justify-center hover:scale-105 transition-transform duration-500">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dashGreen-darkest opacity-50"></div>
                        <p className="text-dashYellow relative z-10 font-bold dashcoin-text text-sm text-center">
                          {selectedPost.coinName}
                        </p>
                      </div>
                    </div>
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
            ) : (
              <DashcoinCard className="flex items-center justify-center h-96">
                <div className="text-center">
                  <FileText className="h-16 w-16 mx-auto text-dashGreen-light mb-4" />
                  <h3 className="text-xl font-medium mb-2">No article selected</h3>
                  <p className="text-gray-400 mb-4">Upload your first research article to get started</p>
                  <button 
                    onClick={() => setShowUploadModal(true)}
                    className="px-4 py-2 bg-dashGreen-light rounded-md hover:bg-dashYellow hover:text-dashGreen-darkest transition-colors"
                  >
                    Upload Article
                  </button>
                </div>
              </DashcoinCard>
            )}
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