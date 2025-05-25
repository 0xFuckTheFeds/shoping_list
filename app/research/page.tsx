"use client";

import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/navbar";
import { DashcoinCard, DashcoinCardContent, DashcoinCardHeader, DashcoinCardTitle } from "@/components/ui/dashcoin-card";
import { Twitter, Search, Calendar, Clock, Hexagon, BookOpen, ArrowRight, Upload, FileText, X, Image as ImageIcon } from "lucide-react";
import { DashcoinLogo } from "@/components/dashcoin-logo";
import {Lock, Shield} from "lucide-react";
import * as Papa from 'papaparse';
import * as mammoth from 'mammoth';

interface Article {
  _id: string
  id: string;
  title: string;
  coinName: string;
  description: string;
  author: string;
  publishDate: string;
  content: string;
  fileName: string;
  imageUrl?: string; 
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
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const filteredPosts = articles.filter((article) => 
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.coinName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const selectedPost = selectedPostId ? 
    articles.find((article) => article.id === selectedPostId) : 
    articles.length > 0 ? articles[0] : null;

    const handleAdminLogin = async () => {
      setAuthError("");
      
      try {
        const response = await fetch('/api/admin/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: adminEmail,
            password: adminPassword,
          }),
        });
        
        const data = await response.json();
        
        // Handle different response status codes
        if (response.status === 429) {
          setAuthError('Too many login attempts. Please try again later.');
          return;
        }
        
        if (response.status === 400) {
          setAuthError('Email and password are required');
          return;
        }
        
        // Check for successful login (changed from data.authenticated to data.success)
        if (response.ok && data.success) {
          setIsAdminMode(true);
          setShowAdminModal(false);
          
          // Remove localStorage usage for security - rely on httpOnly cookies instead
          // The JWT token is now stored in a secure httpOnly cookie
          // localStorage.setItem('dashcoinAdminMode', 'true'); // Remove this line
          
          // Optional: Clear form fields
          setAdminEmail('');
          setAdminPassword('');
          
        } else {
          setAuthError(data.error || 'Invalid credentials');
        }
      } catch (error) {
        console.error('Error authenticating:', error);
        setAuthError('Authentication failed. Please try again.');
      }
    };

  const handleAdminLogout = () => {
    setIsAdminMode(false);
    localStorage.removeItem('dashcoinAdminMode');
  };

  useEffect(() => {
    const bcrypt = require('bcryptjs');
  const password = 'pure2025dashcoin';
  const hash = bcrypt.hashSync(password, 12);
  console.log('Password hash:', hash);
    const savedAdminMode = localStorage.getItem('dashcoinAdminMode');
    if (savedAdminMode === 'true') {
      setIsAdminMode(true);
    }
  }, []);
  
  useEffect(() => {
    
    const fetchArticles = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/articles');
        if (!response.ok) {
          throw new Error('Failed to fetch articles');
        }

        
        const data = await response.json();
        const formattedArticles = data.map((article: any) => ({
          ...article,
          id: article._id 
        }));
        
        setArticles(formattedArticles);
        
        if (formattedArticles.length > 0 && !selectedPostId) {
          setSelectedPostId(formattedArticles[0]._id || formattedArticles[0].id);
        }
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchArticles();
  }, []);
  
  const handleSelectPost = (id: string) => {
    setSelectedPostId(id);
    document.getElementById('content-top')?.scrollIntoView({ behavior: 'smooth' });
  };
  
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

  const processFile = async (file: File) => {
    setIsUploading(true);
    setUploadError("");
    
    try {
      let parsedContent;
      
      if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        parsedContent = await processDocxFile(file);
      } else if (file.name.endsWith('.html')){
        const content = await readFileContent(file);
        parsedContent = parseHtmlContent(content, file.name);
      } else if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const content = await readFileContent(file);
        parsedContent = parseTextContent(content, file.name);
      } else if (file.name.endsWith('.json')) {
        const content = await readFileContent(file);
        parsedContent = parseJsonContent(content);
      } else if (file.name.endsWith('.csv')) {
        const content = await readFileContent(file);
        parsedContent = parseCsvContent(content);
      } else {
        const content = await readFileContent(file);
        parsedContent = parseTextContent(content, file.name);
      }
      
      const tempId = Date.now().toString();
      const newArticleData = {
        ...parsedContent,
        id: tempId,
        fileName: file.name,
        publishDate: new Date().toLocaleDateString()
      };
      
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newArticleData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save article to database');
      }
  
      const savedArticle = await response.json();
      setShowUploadModal(false);
      setIsUploading(false);
      const refreshResponse = await fetch('/api/articles');
      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh articles');
      }
      
      const refreshedData = await refreshResponse.json();
      const formattedArticles = refreshedData.map((article: any) => ({
        ...article,
        id: article._id 
      }));
      
      setArticles(formattedArticles);
      setSelectedPostId(savedArticle._id);
      
    } catch (error) {
      console.error("Error processing file:", error);
      setUploadError(`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the file format and try again.`);
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (selectedPostId && articles.length > 0) {
      const found = articles.find(
        article => article._id === selectedPostId || article.id === selectedPostId
      );
      
      if (!found && articles.length > 0) {
        setSelectedPostId(articles[0]._id || articles[0].id);
      }
    }
  }, [selectedPostId, articles]);
  
  const processDocxFile = async (file: File) => {
    return new Promise<any>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const result = await mammoth.convertToHtml({ arrayBuffer });
          const htmlContent = result.value;
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = htmlContent;
          const paragraphs = tempDiv.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
          let title = '';
          for (let i = 0; i < paragraphs.length; i++) {
            const text = paragraphs[i].textContent?.trim() || '';
            if (text) {
              title = text;
              break;
            }
          }
          if (!title) {
            title = file.name.replace(/\.[^/.]+$/, "");
          }
          const allText = tempDiv.textContent || '';
          const titleIndex = allText.indexOf(title);
          const textAfterTitle = titleIndex >= 0 ? 
            allText.substring(titleIndex + title.length) : 
            allText;
          const description = textAfterTitle.trim().substring(0, 150);
          let coinName = '';
          const coinInTitleMatch = title.match(/([A-Za-z]+\s*Coin)/i);

          if (coinInTitleMatch) {
            coinName = coinInTitleMatch[1].replace(/\s+/g, '');
          } 
          else if (title.toLowerCase().includes('coin')) {
            const firstWord = title.split(/\s+/)[0];
            coinName = firstWord;
          }
          else {
            coinName = title.split(/\s+/)[0];
          }
          
          resolve({
            title,
            coinName,
            description: description.trim() || 'No description available',
            author: 'Research Document',
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

  const handleDeleteArticle = async (id: string) => {
    try {
      const articleToDelete = articles.find(article => article.id === id || article._id === id);
      
      if (!articleToDelete) {
        console.error('Article not found for deletion');
        return;
      }
      
      const deleteId = articleToDelete._id || articleToDelete.id;
      
      const response = await fetch(`/api/articles/${deleteId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete article from database');
      }
      
      setArticles(articles.filter(article => article.id !== id && article._id !== id));
      
      if (selectedPostId === id || selectedPostId === deleteId) {
        const remainingArticles = articles.filter(article => article.id !== id && article._id !== id);
        setSelectedPostId(remainingArticles.length > 0 ? 
          remainingArticles[0]._id || remainingArticles[0].id : ""
        );
      }
    } catch (error) {
      console.error('Error deleting article:', error);
    }
  };
  
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
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const title = lines.length > 0 ? lines[0].trim() : fileName.replace(/\.[^/.]+$/, "");
    let coinName = '';
    const coinInTitleMatch = title.match(/([A-Za-z]+\s*Coin)/i);
    if (coinInTitleMatch) {
      coinName = coinInTitleMatch[1].replace(/\s+/g, '');
    } 
    else if (title.toLowerCase().includes('coin')) {
      const firstWord = title.split(/\s+/)[0];
      coinName = firstWord;
    }
    else {
      coinName = title.split(/\s+/)[0];
    }
    
    const contentWithoutTitle = content.replace(title, '').trim();
    const description = contentWithoutTitle.substring(0, 150);
    const formattedContent = content
      .split('\n')
      .map(line => {
        if (line.trim() === '') return '<br>';
        if (line.trim() === title) return `<h1>${line}</h1>`;
        if (line.trim().startsWith('#')) return `<h2>${line.replace(/^#+\s/, '')}</h2>`;
        if (line.trim().startsWith('##')) return `<h3>${line.replace(/^#+\s/, '')}</h3>`;
        return `<p>${line}</p>`;
      })
      .join('');
    
    return {
      title,
      coinName,
      description: description || 'No description available',
      author: 'Research Document',
      content: formattedContent
    };
  };
  
  const parseJsonContent = (content: string) => {
    try {
      const parsedJson = JSON.parse(content);
      
      return {
        title: parsedJson.title || parsedJson.name || 'Untitled Document',
        coinName: parsedJson.coinName || parsedJson.coin || parsedJson.symbol || 'UNKNOWN',
        description: parsedJson.description || parsedJson.summary || parsedJson.abstract || 'No description available',
        author: parsedJson.author || parsedJson.creator || 'Research Document',
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
        author: data.author || 'Research Document',
        content: '<h2>Data from CSV</h2>' + Object.entries(data)
          .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
          .join('')
      };
    } catch (error) {
      throw new Error("Invalid CSV format");
    }
  };
  
  const parseHtmlContent = (content: string, fileName: string) => {
    try {
      const parser = new DOMParser();
      const htmlDoc = parser.parseFromString(content, 'text/html');
      
      let title = htmlDoc.title || '';
      
      if (!title) {
        const h1 = htmlDoc.querySelector('h1');
        title = h1 ? h1.textContent?.trim() || '' : '';
      }
      
      if (!title) {
        title = fileName.replace(/\.[^/.]+$/, "");
      }
      
      let coinName = '';
      const metaCoin = htmlDoc.querySelector('meta[name="coin"], meta[name="token"], meta[name="symbol"]');
      
      if (metaCoin && metaCoin.getAttribute('content')) {
        coinName = metaCoin.getAttribute('content') || '';
      } else {
        const coinInTitleMatch = title.match(/([A-Za-z]+\s*Coin)|(^|\s)([A-Z]{3,5})(\s|$)/i);
        if (coinInTitleMatch) {
          coinName = (coinInTitleMatch[1] || coinInTitleMatch[3]).replace(/\s+/g, '');
        } else if (title.toLowerCase().includes('token') || title.toLowerCase().includes('coin')) {
          const words = title.split(/\s+/);
          coinName = words.find(word => word.length >= 2 && word.length <= 5 && word === word.toUpperCase()) || words[0];
        } else {
          const tokenTickers = htmlDoc.querySelectorAll('.token-ticker, .token-symbol');
          if (tokenTickers.length > 0) {
            coinName = tokenTickers[0].textContent?.trim() || '';
          } else {
            coinName = title.split(/\s+/)[0];
          }
        }
      }
      
      let description = '';
      const metaDescription = htmlDoc.querySelector('meta[name="description"]');
      
      if (metaDescription && metaDescription.getAttribute('content')) {
        description = metaDescription.getAttribute('content') || '';
      } else {
        const firstParagraph = htmlDoc.querySelector('p');
        description = firstParagraph ? firstParagraph.textContent?.trim().substring(0, 150) || '' : '';
      }
      
      const bodyContent = htmlDoc.body.innerHTML;
      
      return {
        title,
        coinName,
        description: description || 'HTML document about ' + coinName,
        author: 'Research Document',
        content: bodyContent
      };
    } catch (error) {
      console.error("HTML parsing error:", error);
      return parseTextContent(content, fileName);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedPostId) {
      const imageUrl = URL.createObjectURL(file);
      setArticles(prevArticles => 
        prevArticles.map(article => 
          article.id === selectedPostId 
            ? { ...article, imageUrl } 
            : article
        )
      );
      setShowImageUploadModal(false);
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
        {/* Upload Document Modal */}
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
                  ref={fileInputRef}
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

        {/* NEW: Upload Image Modal */}
        {showImageUploadModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-dashGreen-dark p-6 rounded-lg w-full max-w-md border border-dashYellow/20">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-dashYellow">Upload Article Image</h2>
                <button 
                  onClick={() => setShowImageUploadModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="border-2 border-dashed border-dashGreen-light rounded-lg p-6 text-center mb-4">
                <ImageIcon className="mx-auto h-12 w-12 text-dashYellow-light mb-2" />
                <p className="mb-4">Drag & drop an image or click to browse</p>
                <input 
                  type="file" 
                  id="image-upload" 
                  className="hidden" 
                  onChange={handleImageUpload}
                  accept="image/*"
                  ref={imageInputRef}
                />
                <label 
                  htmlFor="image-upload" 
                  className="px-4 py-2 bg-dashGreen-light text-white rounded-md cursor-pointer hover:bg-dashYellow hover:text-dashGreen-darkest transition-colors"
                >
                  Select Image
                </label>
                <p className="mt-2 text-sm text-gray-400">
                  Supported formats: JPG, PNG, GIF, SVG
                </p>
              </div>
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
                  {isAdminMode && (
                    <button 
                      onClick={() => setShowUploadModal(true)}
                      className="flex items-center gap-1 text-dashYellow hover:text-dashYellow-light transition-colors text-sm"
                    >
                      <Upload size={14} />
                      <span>Upload</span>
                    </button>
                  )}
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
                    {isAdminMode && (
                      <button 
                        onClick={() => setShowUploadModal(true)}
                        className="mt-2 px-4 py-2 bg-dashGreen-light rounded-md hover:bg-dashYellow hover:text-dashGreen-darkest transition-colors"
                      >
                        Upload Your First Article
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 pr-2">
                    {filteredPosts.map((article) => (
                      <div 
                        key={article._id || article.id} 
                        className={`p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                          (article._id === selectedPostId || article.id === selectedPostId)
                            ? 'bg-dashGreen-dark border-l-2 border-dashYellow'
                            : 'hover:bg-dashGreen-dark/50'
                        }`}
                        onClick={() => handleSelectPost(article._id || article.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-grow">
                            <h3 className="font-medium text-dashYellow-light mb-1 line-clamp-1">
                              {article.title}
                            </h3>
                            <p className="text-sm opacity-70 mb-1 line-clamp-2">
                              {article.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs opacity-60">
                              <Calendar className="h-3 w-3" />
                              <span>{article.publishDate}</span>
                            </div>
                          </div>
                          {isAdminMode && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteArticle(article.id || article._id);
                              }}
                              className="ml-2 p-1 text-gray-400 hover:text-red-400 transition-colors"
                              title="Delete article"
                            >
                              <X size={16} />
                            </button>
                          )}
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
                    
                    {/* Image area with upload option */}
                    <div 
                      className="flex-shrink-0 w-32 h-32 overflow-hidden rounded-lg border border-dashYellow/20 relative group"
                      onClick={() => setShowImageUploadModal(true)}
                    >
                      {selectedPost.imageUrl ? (
                        <div className="relative w-full h-full">
                          <img 
                            src={selectedPost.imageUrl} 
                            alt={selectedPost.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" 
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <ImageIcon className="text-white h-8 w-8" />
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-full h-full bg-dashGreen-dark flex items-center justify-center hover:scale-105 transition-transform duration-500 cursor-pointer">
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dashGreen-darkest opacity-50"></div>
                          <div className="flex flex-col items-center justify-center gap-2">
                            <p className="text-dashYellow relative z-10 font-bold text-sm text-center">
                              {selectedPost.coinName}
                            </p>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <ImageIcon className="h-6 w-6 text-dashYellow-light" />
                              <span className="text-xs text-dashYellow-light">Add image</span>
                            </div>
                          </div>
                        </div>
                      )}
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
                  {isAdminMode && (
                    <button 
                      onClick={() => setShowUploadModal(true)}
                      className="mt-2 px-4 py-2 bg-dashGreen-light rounded-md hover:bg-dashYellow hover:text-dashGreen-darkest transition-colors"
                    >
                      Upload Your Article
                    </button>
                  )}
                </div>
              </DashcoinCard>
            )}
          </div>
        </div>
      </main>

      {showAdminModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-dashGreen-dark p-6 rounded-lg w-full max-w-md border border-dashYellow/20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Admin Authentication</h2>
              <button 
                onClick={() => setShowAdminModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="admin-email" className="block text-sm font-medium mb-1">
                  Email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  className="w-full px-4 py-2 rounded-md bg-dashGreen-darkest border border-dashGreen-light focus:border-dashYellow focus:outline-none"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="input your email"
                />
              </div>
              
              <div>
                <label htmlFor="admin-password" className="block text-sm font-medium mb-1">
                  Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  className="w-full px-4 py-2 rounded-md bg-dashGreen-darkest border border-dashGreen-light focus:border-dashYellow focus:outline-none"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter password"
                />
              </div>
              
              {authError && (
                <div className="bg-red-900/30 border border-red-500 text-red-200 p-3 rounded">
                  {authError}
                </div>
              )}
              
              <button
                onClick={handleAdminLogin}
                className="w-full bg-dashYellow text-dashGreen-darkest py-2 rounded-md hover:bg-dashYellow-light transition-colors font-medium"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}

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

          <div className="fixed top-4 right-4 z-50">
            {isAdminMode ? (
              <button
                onClick={handleAdminLogout}
                className="flex items-center gap-2 bg-dashYellow text-dashGreen-darkest px-3 py-2 rounded-md shadow-lg hover:bg-dashYellow-light transition-colors"
                title="Exit Admin Mode"
              >
                <Shield size={16} />
                <span>Exit Admin Mode</span>
              </button>
            ) : (
              <button
                onClick={() => setShowAdminModal(true)}
                className="flex items-center gap-2 bg-dashGreen-dark border border-dashYellow/30 text-dashYellow px-3 py-2 rounded-md shadow-lg hover:bg-dashGreen-light transition-colors"
                title="Enter Admin Mode"
              >
                <Lock size={16} />
                <span>Admin</span>
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}