import * as React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'text-sm font-semibold whitespace-nowrap',
    'inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer outline-none',
    'transition-all duration-180 ease-out',
    'focus-visible:shadow-[0_0_0_4px_rgba(124,77,255,0.15)]',
    'disabled:pointer-events-none disabled:opacity-50',
    'aria-invalid:shadow-[0_0_0_4px_rgba(239,68,68,0.15)]',
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        default: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl border border-border',
        destructive: [
          'bg-destructive text-destructive-foreground rounded-xl',
          'hover:bg-destructive/90',
          'focus-visible:shadow-[0_0_0_4px_rgba(239,68,68,0.15)]',
        ],
        outline: [
          'border-2 border-border bg-transparent rounded-xl',
          'hover:bg-accent hover:text-accent-foreground hover:border-primary',
        ],
        primary: [
          'bg-gradient-to-r from-[#7C4DFF] to-[#FF3CA6] text-white rounded-xl',
          'hover:shadow-[0_12px_30px_-6px_rgba(124,77,255,0.4),0_10px_15px_-7px_rgba(255,60,166,0.3)]',
          'hover:-translate-y-0.5',
          'active:translate-y-0 active:scale-98',
        ],
        secondary: [
          'bg-transparent text-foreground border-2 border-border rounded-xl',
          'hover:border-primary hover:bg-gradient-to-r hover:from-[rgba(124,77,255,0.05)] hover:to-[rgba(255,60,166,0.05)]',
        ],
        ghost: 'hover:bg-accent hover:text-accent-foreground rounded-xl',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-6 py-3',
        sm: 'h-9 gap-1.5 px-4 py-2 text-sm',
        lg: 'h-12 px-8 py-3.5 text-base',
        icon: 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
