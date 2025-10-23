'use client';

import localFont from 'next/font/local';
import { useEffect, useState } from 'react';
import { APP_CONFIG_DEFAULTS } from '@/app-config';
import ThemeToggle from '@/components/theme-toggle';
import { AuthButton } from '@/components/auth-button';
import './globals.css';

const commitMono = localFont({
  src: [
    {
      path: './fonts/CommitMono-400-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/CommitMono-700-Regular.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: './fonts/CommitMono-400-Italic.otf',
      weight: '400',
      style: 'italic',
    },
    {
      path: './fonts/CommitMono-700-Italic.otf',
      weight: '700',
      style: 'italic',
    },
  ],
  variable: '--font-commit-mono',
});

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  
  // Check authentication status
  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          const userLoggedIn = Boolean(d?.user);
          setIsLoggedIn(userLoggedIn);
          
          // Redirect to login if not authenticated and not already on auth pages
          if (!userLoggedIn && typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            const isAuthPage = currentPath.startsWith('/auth/');
            if (!isAuthPage) {
              window.location.href = '/auth/login';
            }
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsLoggedIn(false);
          // Redirect to login on error (likely not authenticated)
          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            const isAuthPage = currentPath.startsWith('/auth/');
            if (!isAuthPage) {
              window.location.href = '/auth/login';
            }
          }
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pageTitle = 'BookWise - Intelligent Sales Assistant';
  const pageDescription = 'AI-powered book consultation and ordering assistant';
  const styles = '';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {styles && <style>{styles}</style>}
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className={`${commitMono.variable} overflow-x-hidden antialiased`}
      >
        {/* Modern Header - Only show for authenticated users */}
        {isLoggedIn && (
          <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100 sticky top-0 z-50 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              {/* Logo Section */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl transform hover:scale-105 transition-transform duration-200">
                    <span className="text-white text-2xl">🤖</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">BookWise</h1>
                  <p className="text-sm text-gray-500 font-medium">Intelligent Sales Assistant</p>
                </div>
              </div>
              
              {/* Navigation */}
              <nav className="hidden md:flex items-center space-x-1">
                <a href="/" className="px-4 py-2 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-xl font-medium transition-all duration-200">Home</a>
                <a href="#" className="px-4 py-2 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-xl font-medium transition-all duration-200">Books</a>
                <a href="#" className="px-4 py-2 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-xl font-medium transition-all duration-200">Consultation</a>
                <a href="/contact" className="px-4 py-2 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-xl font-medium transition-all duration-200">Support</a>
              </nav>
              
              {/* Right Section */}
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <AuthButton />
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-600">Online</span>
                </div>
              </div>
            </div>
          </div>
          </header>
        )}

        {/* Main Content */}
        <main className="min-h-screen">
          {isLoggedIn === null ? (
            // Loading state while checking authentication
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
                  <span className="text-white text-2xl">🤖</span>
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  BookWise AI
                </h2>
                <p className="text-gray-600">Loading...</p>
              </div>
            </div>
          ) : isLoggedIn ? (
            // Authenticated user content
            <div className="mx-auto w-full max-w-6xl px-4 py-8">{children}</div>
          ) : (
            // Unauthenticated user content (auth pages only)
            <div className="w-full">{children}</div>
          )}
        </main>

        {/* Modern Footer - Only show for authenticated users */}
        {isLoggedIn && (
          <footer className="bg-gradient-to-br from-gray-900 via-teal-800 to-emerald-900 text-white py-16 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:30px_30px]"></div>
          </div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-12">
              {/* Brand Section */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
                      <span className="text-white text-2xl">🤖</span>
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-900 animate-pulse"></div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">BookWise AI</h3>
                    <p className="text-gray-400 font-medium">Intelligent Book Assistant</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-6 max-w-md leading-relaxed">
                  Transform your reading journey with AI-powered book recommendations. 
                  Discover, explore, and order your next favorite book through intelligent conversation.
                </p>
                <div className="flex space-x-4">
                  <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110">
                    <span className="sr-only">Facebook</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110">
                    <span className="sr-only">Twitter</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                  <a href="https://www.linkedin.com/in/meegada-vamsidhar-reddy-2323902b3" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110">
                    <span className="sr-only">LinkedIn</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M19 0H5a5 5 0 00-5 5v14a5 5 0 005 5h14a5 5 0 005-5V5a5 5 0 00-5-5zM8 19H5V8h3v11zM6.5 6.732c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zM20 19h-3v-5.604c0-3.368-4-3.113-4 0V19h-3V8h3v1.765c1.396-2.586 7-2.777 7 2.476V19z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              </div>
              
              {/* Quick Links */}
              <div>
                <h4 className="text-lg font-bold mb-6 text-white">Discover</h4>
                <ul className="space-y-3">
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full group-hover:scale-125 transition-transform duration-200"></span>
                    Browse Books
                  </a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full group-hover:scale-125 transition-transform duration-200"></span>
                    AI Consultation
                  </a></li>
                  <li><a href="http://localhost:8000/orders-dashboard" target="_blank" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full group-hover:scale-125 transition-transform duration-200"></span>
                    My Orders
                  </a></li>
                  <li><a href="/auth/login" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2 group" title="Admin access - requires admin login">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full group-hover:scale-125 transition-transform duration-200"></span>
                     Admin Panel
                  </a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full group-hover:scale-125 transition-transform duration-200"></span>
                    Reading List
                  </a></li>
                </ul>
              </div>
              
              {/* Support */}
              <div>
                <h4 className="text-lg font-bold mb-6 text-white">Support</h4>
                <ul className="space-y-3">
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full group-hover:scale-125 transition-transform duration-200"></span>
                    Help Center
                  </a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full group-hover:scale-125 transition-transform duration-200"></span>
                    Contact Us
                  </a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full group-hover:scale-125 transition-transform duration-200"></span>
                    FAQ
                  </a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full group-hover:scale-125 transition-transform duration-200"></span>
                    Live Chat
                  </a></li>
                </ul>
              </div>
            </div>
            
            {/* Bottom Section */}
            <div className="border-t border-gray-700/50 mt-12 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-gray-400 text-sm">
                  &copy; 2024 BookWise AI. Crafted with ❤️ for book lovers worldwide.
                </p>
                <div className="flex items-center gap-6 text-sm">
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Privacy Policy</a>
                  <span className="text-gray-600">•</span>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Terms of Service</a>
                  <span className="text-gray-600">•</span>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Cookies</a>
                </div>
              </div>
            </div>
          </div>
        </footer>
        )}
      </body>
    </html>
  );
}
