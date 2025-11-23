'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AuthButton } from '@/components/auth-button';
import ThemeToggle from '@/components/theme-toggle';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
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

  return (
    <>
      {/* Modern Header - Only show for authenticated users */}
      {isLoggedIn && (
        <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 shadow-lg backdrop-blur-md transition-all duration-300 dark:border-gray-800 dark:bg-gray-900/95">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-20 items-center justify-between">
              {/* Logo Section */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="flex h-12 w-12 transform items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 shadow-xl transition-transform duration-200 hover:scale-105">
                    <span className="text-2xl text-white">🤖</span>
                  </div>
                  <div className="absolute -top-1 -right-1 h-4 w-4 animate-pulse rounded-full border-2 border-white bg-green-400"></div>
                </div>
                <div>
                  <h1 className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-2xl font-bold text-transparent dark:from-white dark:to-gray-300">
                    BookWise
                  </h1>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Intelligent Sales Assistant</p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="hidden items-center space-x-1 md:flex">
                <Link
                  href="/"
                  className="rounded-xl px-4 py-2 font-medium text-gray-700 transition-all duration-200 hover:bg-orange-50 hover:text-orange-600 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-orange-400"
                >
                  Home
                </Link>
                <a
                  href="#"
                  className="rounded-xl px-4 py-2 font-medium text-gray-700 transition-all duration-200 hover:bg-orange-50 hover:text-orange-600"
                >
                  Books
                </a>
                <a
                  href="#"
                  className="rounded-xl px-4 py-2 font-medium text-gray-700 transition-all duration-200 hover:bg-orange-50 hover:text-orange-600"
                >
                  Consultation
                </a>
                <a
                  href="/contact"
                  className="rounded-xl px-4 py-2 font-medium text-gray-700 transition-all duration-200 hover:bg-orange-50 hover:text-orange-600"
                >
                  Support
                </a>
              </nav>

              {/* Right Section */}
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <AuthButton />
                <div className="hidden items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 sm:flex dark:bg-gray-800">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-green-400"></div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Online</span>
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
          <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-lg">
                <span className="text-2xl text-white">🤖</span>
              </div>
              <h2 className="mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-xl font-bold text-transparent">
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
        <footer className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-teal-800 to-emerald-900 py-8 text-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 h-full w-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:30px_30px]"></div>
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              {/* Left Side - Brand and Description */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 shadow-xl">
                    <span className="text-xl text-white">🤖</span>
                  </div>
                  <div className="absolute -top-1 -right-1 h-3 w-3 animate-pulse rounded-full border-2 border-gray-900 dark:border-slate-900 bg-green-400"></div>
                </div>
                <div>
                  <h3 className="bg-gradient-to-r from-white to-gray-300 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-xl font-bold text-transparent">
                    BookWise AI
                  </h3>
                  <p className="text-sm font-medium text-gray-400 dark:text-slate-400">Intelligent Book Assistant</p>
                </div>
              </div>

              {/* Right Side - Social Icons */}
              <div className="flex items-center space-x-3">
                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 dark:bg-slate-700/50 transition-all duration-200 hover:scale-110 hover:bg-white/20 dark:hover:bg-slate-600/70"
                >
                  <span className="sr-only">Facebook</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 dark:bg-slate-700/50 transition-all duration-200 hover:scale-110 hover:bg-white/20 dark:hover:bg-slate-600/70"
                >
                  <span className="sr-only">Twitter</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a
                  href="https://www.linkedin.com/in/meegada-vamsidhar-reddy-2323902b3"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 dark:bg-slate-700/50 transition-all duration-200 hover:scale-110 hover:bg-white/20 dark:hover:bg-slate-600/70"
                >
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      d="M19 0H5a5 5 0 00-5 5v14a5 5 0 005 5h14a5 5 0 005-5V5a5 5 0 00-5-5zM8 19H5V8h3v11zM6.5 6.732c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zM20 19h-3v-5.604c0-3.368-4-3.113-4 0V19h-3V8h3v1.765c1.396-2.586 7-2.777 7 2.476V19z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a
                  href="https://github.com/MeegadaVamsidhar"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 dark:bg-slate-700/50 transition-all duration-200 hover:scale-110 hover:bg-white/20 dark:hover:bg-slate-600/70"
                >
                  <span className="sr-only">GitHub</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      )}
    </>
  );
}
