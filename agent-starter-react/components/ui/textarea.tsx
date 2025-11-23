'use client';

import * as React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className = '', ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={`w-full rounded-xl border border-separator1 bg-input px-4 py-3 text-sm text-foreground placeholder-muted-foreground transition-all duration-150 focus:border-primary focus:outline-none focus:shadow-[0_0_0_4px_rgba(124,77,255,0.1)] resize-vertical min-h-[120px] ${className}`}
      {...props}
    />
  );
});

export default Textarea;
