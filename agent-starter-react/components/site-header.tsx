'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface UserInfo {
  id: string;
  email: string;
}

export function SiteHeader() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

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
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  return (
    <header className="bg-gradient-to-r from-white/90 via-blue-50/80 to-purple-50/80 supports-[backdrop-filter]:bg-gradient-to-r supports-[backdrop-filter]:from-white/70 supports-[backdrop-filter]:via-blue-50/60 supports-[backdrop-filter]:to-purple-50/60 sticky top-0 z-50 w-full border-b border-gradient-to-r from-blue-200/50 to-purple-200/50 backdrop-blur">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-4 font-mono text-lg font-bold tracking-[0.25em] uppercase md:text-xl"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Main.svg" alt="Logo" width={50} height={50} />
          <span className="text-lg md:text-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">AI Sales Assistant</span>
        </Link>
        <div className="relative ml-6 flex items-center gap-3" ref={menuRef}>
          {user ? (
            <>
              <button
                type="button"
                className="flex items-center gap-3 rounded-md bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-gradient-to-r from-blue-300 to-purple-300 px-3 py-2 text-sm hover:from-blue-500/20 hover:to-purple-500/20 transition-all duration-300"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((o) => !o)}
              >
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white flex size-8 items-center justify-center rounded-full font-semibold shadow-lg">
                  {user.email?.[0]?.toUpperCase()}
                </div>
                <span className="hidden max-w-[16rem] truncate md:inline">{user.email}</span>
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="bg-background absolute top-[calc(100%+6px)] right-0 w-44 overflow-hidden rounded-md border shadow-lg"
                >
                  <Link
                    href="/"
                    className={cn(
                      'block px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900',
                      pathname === '/' && 'bg-neutral-100 dark:bg-neutral-900'
                    )}
                    onClick={() => setMenuOpen(false)}
                    role="menuitem"
                  >
                    Home
                  </Link>
                  <Link
                    href="/auth/login"
                    className={cn(
                      'block px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900',
                      pathname === '/components/livekit' && 'bg-neutral-100 dark:bg-neutral-900'
                    )}
                    onClick={() => setMenuOpen(false)}
                    role="menuitem"
                  >
                    Demo
                  </Link>
                  <Link
                    href="/contact"
                    className={cn(
                      'block px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900',
                      pathname === '/contact' && 'bg-neutral-100 dark:bg-neutral-900'
                    )}
                    onClick={() => setMenuOpen(false)}
                    role="menuitem"
                  >
                    Contact
                  </Link>
                  <button
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900"
                    onClick={async () => {
                      await fetch('/api/auth/logout', { method: 'POST' });
                      window.location.href = '/auth/login';
                    }}
                    role="menuitem"
                  >
                    Logout
                  </button>
                </div>
              )}
            </>
          ) : (
            <Link
              href="/auth/login"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-md px-3 py-2 text-xs font-medium shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
