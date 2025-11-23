'use client';

import * as React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { cn } from '@/lib/utils';

const toggleVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 rounded-xl',
    'text-sm font-semibold whitespace-nowrap',
    'cursor-pointer outline-none transition-all duration-150 ease-out',
    'focus-visible:shadow-[0_0_0_4px_rgba(124,77,255,0.15)]',
    'aria-invalid:shadow-[0_0_0_4px_rgba(239,68,68,0.15)]',
    'disabled:pointer-events-none disabled:opacity-50',
    'data-[state=on]:bg-primary data-[state=on]:text-white',
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        default:
          'bg-secondary hover:bg-secondary/80 text-foreground border border-border',
        primary:
          'bg-secondary hover:bg-secondary/80 text-foreground border border-border data-[state=on]:bg-gradient-to-r data-[state=on]:from-[#7C4DFF] data-[state=on]:to-[#FF3CA6] data-[state=on]:border-transparent',
        secondary:
          'bg-secondary hover:bg-secondary/80 text-foreground border border-border data-[state=on]:bg-accent data-[state=on]:text-primary',
        outline: [
          'border-2 border-border bg-transparent text-foreground',
          'hover:bg-secondary',
        ],
      },
      size: {
        default: 'h-10 px-4 min-w-10',
        sm: 'h-9 px-3 min-w-9',
        lg: 'h-11 px-5 min-w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
