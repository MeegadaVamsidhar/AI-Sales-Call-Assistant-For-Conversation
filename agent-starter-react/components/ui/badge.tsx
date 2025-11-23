'use client';

import * as React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-gradient-to-r from-[#7C4DFF] to-[#FF3CA6] text-white',
  secondary: 'bg-bg2 text-fg2 border border-separator1',
  destructive: 'bg-gradient-to-r from-red-500 to-red-600 text-white',
  outline: 'border-2 border-separator2 text-foreground bg-transparent',
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className = '', variant = 'default', ...props },
  ref
) {
  return (
    <span
      ref={ref}
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
});

export default Badge;


