'use client';

import * as React from 'react';

type DivProps = React.HTMLAttributes<HTMLDivElement> & { className?: string };

export const Card = React.forwardRef<HTMLDivElement, DivProps>(function Card(
  { className = '', ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={`rounded-2xl border border-border bg-card/70 backdrop-blur-md p-0 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] transition-all duration-180 ${className}`}
      {...props}
    />
  );
});

export const CardHeader = ({ className = '', ...props }: DivProps) => (
  <div className={`p-6 ${className}`} {...props} />
);

export const CardContent = ({ className = '', ...props }: DivProps) => (
  <div className={`p-6 pt-0 ${className}`} {...props} />
);

export const CardTitle = ({ className = '', ...props }: DivProps) => (
  <h3 className={`text-xl font-semibold text-foreground ${className}`} {...props} />
);

export const CardDescription = ({ className = '', ...props }: DivProps) => (
  <p className={`text-sm text-muted-foreground mt-1.5 ${className}`} {...props} />
);

export default Card;


