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
        className
      )}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-4">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
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
          <div className="space-y-2">
            <h3 className="text-sm font-bold tracking-wide text-neutral-500 uppercase">
              BookWise Dashboard
            </h3>
            <ul className="flex gap-4 text-sm">
              <li>
                <a
                  href="http://localhost:8000/orders-dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary flex items-center gap-1 rounded-md border px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-all"
                >
                  📚 View Orders
                </a>
              </li>
              <li>
                <a
                  href="http://localhost:8000/orders/all"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary flex items-center gap-1"
                >
                  📊 API Data
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-bold tracking-wide text-neutral-500 uppercase">
              Resources
            </h3>
            <ul className="flex gap-4 text-sm">
              <li>
                <a
                  target="_blank"
                  rel="noreferrer"
                  href="https://docs.livekit.io/"
                  className="hover:text-primary"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  target="_blank"
                  rel="noreferrer"
                  href="https://docs.livekit.io/agents"
                  className="hover:text-primary"
                >
                  AI Agents
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-bold tracking-wide text-neutral-500 uppercase">
              Company Info
            </h3>
            <ul className="flex gap-4 text-sm">
              <li>
                <a target="_blank" rel="noreferrer" href="" className="hover:text-primary">
                  About
                </a>
              </li>
              <li>
                <a target="_blank" rel="noreferrer" href="/contact" className="hover:text-primary">
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-bold tracking-wide text-neutral-500 uppercase">
              Connect With Us
            </h3>
            <div className="flex gap-3 text-sm">
              <a
                target="_blank"
                rel="noreferrer"
                href="mailto:meegadavamsi76@gmail.com"
                className="hover:text-primary rounded-md border px-3 py-1.5"
              >
                Email
              </a>
              <a
                target="_blank"
                rel="noreferrer"
                href="https://github.com/MeegadaVamsidhar"
                className="hover:text-primary rounded-md border px-3 py-1.5"
              >
                GitHub
              </a>
              <a
                target="_blank"
                rel="noreferrer"
                href="https://www.linkedin.com/in/meegada-vamsidhar-reddy-2323902b3"
                className="hover:text-primary rounded-md border px-3 py-1.5"
              >
                LinkedIn
              </a>
            </div>
          </div>
          <p className="text-sm text-neutral-500">
            © {new Date().getFullYear()} Vamsidhar Reddy. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
