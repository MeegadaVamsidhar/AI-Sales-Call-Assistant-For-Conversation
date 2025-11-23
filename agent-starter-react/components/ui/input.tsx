'use client';

import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = '', ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={`w-full rounded-xl border border-input bg-input px-4 py-3 text-sm text-foreground placeholder-muted-foreground transition-all duration-150 focus:border-primary focus:outline-none focus:shadow-[0_0_0_4px_rgba(124,77,255,0.1)] ${className}`}
      {...props}
    />
  );
});

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className = '', ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={`w-full rounded-xl border border-input bg-input px-4 py-3 text-sm text-foreground placeholder-muted-foreground transition-all duration-150 focus:border-primary focus:outline-none focus:shadow-[0_0_0_4px_rgba(124,77,255,0.1)] min-h-[120px] resize-y ${className}`}
      {...props}
    />
  );
});

export default Input;


