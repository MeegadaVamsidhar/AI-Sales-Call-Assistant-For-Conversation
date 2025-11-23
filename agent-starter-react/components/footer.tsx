'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer
      suppressHydrationWarning
      className={cn(
        'text-foreground bg-background/60 border-t backdrop-blur',
        'w-full',
        // Make footer fixed at the bottom with subtle elevation
        'fixed right-0 bottom-0 left-0 z-40 shadow-[0_-6px_20px_-6px_rgba(0,0,0,0.12)]',
        // Dark mode enhancements - Modern slate palette
        'dark:bg-background/98 dark:border-border/80 dark:shadow-[0_-6px_20px_-6px_rgba(0,0,0,0.6)]',
        className
      )}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-2">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Product
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-primary">Overview</Link>
              </li>
              <li>
                <Link href="/components/livekit" className="hover:text-primary">Demo</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary">Contact</Link>
              </li>
            </ul>
          </div> */}
          {/* Admin Dashboard links removed - users can see their orders in My Orders tab */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold tracking-wide text-muted-foreground uppercase">
              Resources
            </h3>
            <ul className="flex gap-4 text-sm">
              <li>
                <a
                  target="_blank"
                  rel="noreferrer"
                  href="https://docs.livekit.io/"
                  className="text-foreground hover:text-primary transition-colors"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  target="_blank"
                  rel="noreferrer"
                  href="https://docs.livekit.io/agents"
                  className="text-gray-700 hover:text-primary dark:text-slate-300 dark:hover:text-blue-400 transition-colors"
                >
                  AI Agents
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-bold tracking-wide text-neutral-500 uppercase dark:text-slate-400">
              Company Info
            </h3>
            <ul className="flex gap-4 text-sm">
              <li>
                <a target="_blank" rel="noreferrer" href="" className="text-gray-700 hover:text-primary dark:text-slate-300 dark:hover:text-blue-400 transition-colors">
                  About
                </a>
              </li>
              <li>
                <a target="_blank" rel="noreferrer" href="/contact" className="text-gray-700 hover:text-primary dark:text-slate-300 dark:hover:text-blue-400 transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-bold tracking-wide text-neutral-500 uppercase dark:text-slate-400">
              Connect With Us
            </h3>
            <div className="flex gap-3 text-sm">
              <a
                target="_blank"
                rel="noreferrer"
                href="mailto:meegadavamsi76@gmail.com"
                className="text-foreground hover:text-primary rounded-md border border-border px-3 py-1.5 transition-colors hover:bg-muted"
              >
                Email
              </a>
              <a
                target="_blank"
                rel="noreferrer"
                href="https://github.com/MeegadaVamsidhar"
                className="text-gray-700 hover:text-primary rounded-md border border-gray-300 px-3 py-1.5 transition-colors dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-blue-400 dark:hover:border-slate-500"
              >
                GitHub
              </a>
              <a
                target="_blank"
                rel="noreferrer"
                href="https://www.linkedin.com/in/meegada-vamsidhar-reddy-2323902b3"
                className="text-gray-700 hover:text-primary rounded-md border border-gray-300 px-3 py-1.5 transition-colors dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-blue-400 dark:hover:border-slate-500"
              >
                LinkedIn
              </a>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Vamsidhar Reddy. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
