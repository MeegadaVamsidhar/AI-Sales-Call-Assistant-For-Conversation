'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Moon, Sun, Home, BookOpen, Phone, LogOut, Menu, X, Sparkles } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface UserInfo {
  id: string;
  email: string;
}

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/books', label: 'Books', icon: BookOpen },
  { href: '/consultation', label: 'Consultation', icon: Sparkles },
  { href: '/support', label: 'Support', icon: Phone },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setUser(d?.user ?? null);
      })
      .catch(() => setUser(null));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 w-full transition-all duration-300',
          scrolled
            ? 'border-b border-slate-200 bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-black/20'
            : 'border-b border-transparent bg-white/60 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-900/75'
        )}
      >
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/home"
            className="group flex items-center gap-3 transition-all duration-300 hover:scale-105"
          >
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Main.svg"
                alt="BookWise Logo"
                width={45}
                height={45}
                className="transition-transform duration-300 group-hover:rotate-12"
              />
              <div className="absolute -inset-1 -z-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-40" />
            </div>
            <div className="flex flex-col">
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-xl font-bold text-transparent dark:from-purple-400 dark:via-pink-400 dark:to-purple-400 sm:text-2xl">
                BookWise
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Intelligent Sales Assistant
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'group relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="absolute inset-x-0 -bottom-[1.15rem] h-0.5 bg-gradient-to-r from-purple-600 to-pink-600" />
                  )}
                  {!isActive && (
                    <span className="absolute inset-0 -z-10 rounded-lg bg-slate-100 opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:bg-slate-800" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="group relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all duration-300 hover:border-purple-500/50 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 transition-transform duration-300 group-hover:rotate-180" />
                ) : (
                  <Moon className="h-5 w-5 transition-transform duration-300 group-hover:-rotate-12" />
                )}
              </button>
            )}

            {/* User Menu / Login */}
            <div className="relative hidden lg:block" ref={menuRef}>
              {user ? (
                <>
                  <button
                    type="button"
                    className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-300 hover:border-purple-500/50 hover:bg-slate-50 hover:shadow-md dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((o) => !o)}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-600 font-semibold text-white shadow-md">
                      {user.email?.[0]?.toUpperCase()}
                    </div>
                    <span className="max-w-[10rem] truncate">
                      {user.email}
                    </span>
                  </button>
                  {menuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-[calc(100%+0.5rem)] w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          Signed in as
                        </p>
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {user.email}
                        </p>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/"
                          className={cn(
                            'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-200',
                            pathname === '/'
                              ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                              : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                          )}
                          onClick={() => setMenuOpen(false)}
                          role="menuitem"
                        >
                          <Home className="h-4 w-4" />
                          Home
                        </Link>
                        <button
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 transition-colors duration-200 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                          onClick={async () => {
                            await fetch('/api/auth/logout', { method: 'POST' });
                            window.location.href = '/auth/login';
                          }}
                          role="menuitem"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href="/auth/login"
                  className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                  <span className="relative z-10">Get Started</span>
                  <div className="absolute inset-0 -z-0 bg-gradient-to-r from-purple-700 to-pink-700 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all duration-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {
        mobileMenuOpen && (
          <div className="fixed inset-0 top-20 z-40 bg-[#0F172A]/95 backdrop-blur-lg lg:hidden">
            <nav className="flex h-full flex-col p-6">
              <div className="space-y-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-all duration-200',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-gray-300 hover:bg-white/5 hover:text-white'
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-auto space-y-3 border-t border-border pt-6">
                {user ? (
                  <>
                    <div className="rounded-lg bg-white/5 p-4">
                      <p className="text-xs font-medium text-gray-400">
                        Signed in as
                      </p>
                      <p className="truncate text-sm font-semibold text-white">
                        {user.email}
                      </p>
                    </div>
                    <button
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-red-700"
                      onClick={async () => {
                        await fetch('/api/auth/logout', { method: 'POST' });
                        window.location.href = '/auth/login';
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth/login"
                    className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#7C4DFF] to-[#FF3CA6] px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )
      }
    </>
  );
}
