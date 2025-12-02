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
          'sticky top-0 z-50 w-full border-b transition-all duration-200',
          scrolled
            ? 'border-slate-200 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80'
            : 'border-transparent bg-white/0 backdrop-blur-sm dark:border-transparent dark:bg-slate-900/20'
        )}
      >
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          {/* Logo */}
          {/* Logo */}
          <Link
            href="/home"
            className="group flex items-center gap-3 transition-opacity hover:opacity-90"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg shadow-purple-500/20">
              <img
                src="/Main.svg"
                alt="BookWise Logo"
                width={24}
                height={24}
                className="h-6 w-6 text-white invert filter"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-none tracking-tight text-slate-900 dark:text-white">
                BookWise
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Intelligent Sales Assistant
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {/* Desktop Navigation */}
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
                    'group relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-200',
                    isActive
                      ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  )}
                >
                  <Icon className={cn("h-4 w-4 transition-colors", isActive ? "text-purple-600 dark:text-purple-400" : "text-slate-400 group-hover:text-purple-600 dark:text-slate-500 dark:group-hover:text-purple-400")} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Online Indicator */}
            {/* Online Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50/50 border border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Online</span>
            </div>

            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="group relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-all hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-purple-900 dark:hover:bg-purple-900/20 dark:hover:text-purple-400"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4 transition-transform duration-500 group-hover:rotate-90" />
                ) : (
                  <Moon className="h-4 w-4 transition-transform duration-500 group-hover:-rotate-12" />
                )}
              </button>
            )}

            {/* User Menu / Login */}
            <div className="relative hidden lg:block" ref={menuRef}>
              {user ? (
                <>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-white pl-1 pr-3 py-1 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((o) => !o)}
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-600 text-xs font-semibold text-white">
                      {user.email?.[0]?.toUpperCase()}
                    </div>
                    <span className="max-w-[8rem] truncate hidden sm:inline-block">
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
