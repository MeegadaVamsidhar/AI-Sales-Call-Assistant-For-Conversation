'use client';

import { type RefObject, forwardRef, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export function useAutoScroll(scrollContentContainerRef: RefObject<Element | null>) {
  useEffect(() => {
    const container = scrollContentContainerRef.current as HTMLElement | null;
    if (!container) return;

    const SCROLL_LOCK_THRESHOLD_PX = 100; // only autoscroll when user is close to bottom
    let userScrolled = false;
    let scrollTimeout: NodeJS.Timeout;
    let isUserScrolling = false;

    const handleScroll = () => {
      isUserScrolling = true;
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      userScrolled = distanceFromBottom > SCROLL_LOCK_THRESHOLD_PX;

      // Clear existing timeout
      clearTimeout(scrollTimeout);

      // Set a timeout to reset userScrolled flag after user stops scrolling
      scrollTimeout = setTimeout(() => {
        userScrolled = false;
        isUserScrolling = false;
      }, 2000); // Increased timeout to give users more time to read
    };

    const scrollToBottom = () => {
      // Only auto-scroll if user hasn't manually scrolled up and isn't currently scrolling
      if (!userScrolled && !isUserScrolling) {
        const distanceFromBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight;
        const shouldStickToBottom = distanceFromBottom <= SCROLL_LOCK_THRESHOLD_PX;
        if (shouldStickToBottom) {
          container.scrollTop = container.scrollHeight;
        }
      }
    };

    const resizeObserver = new ResizeObserver(scrollToBottom);
    resizeObserver.observe(container);

    // Add scroll event listener
    container.addEventListener('scroll', handleScroll, { passive: true });

    // initial alignment on mount - scroll to bottom
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 100);

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [scrollContentContainerRef]);
}
interface ChatProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const ChatMessageView = forwardRef<HTMLDivElement, ChatProps>(
  ({ className, children, style, ...props }, externalRef) => {
    const internalRef = useRef<HTMLDivElement>(null);

    // Use external ref if provided, otherwise use internal ref
    const scrollContentRef = (externalRef as RefObject<HTMLDivElement>) || internalRef;

    useAutoScroll(scrollContentRef);

    return (
      <div
        ref={scrollContentRef}
        className={cn('flex flex-col', className)}
        style={style}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ChatMessageView.displayName = 'ChatMessageView';
