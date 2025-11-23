import * as React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  [
    'relative w-full rounded-xl border px-6 py-4 text-sm grid grid-cols-[0_1fr] gap-y-1 items-start transition-all duration-150',
    'has-[>svg]:grid-cols-[calc(var(--spacing)*5)_1fr] has-[>svg]:gap-x-4 [&>svg]:size-5 [&>svg]:translate-y-0.5 [&>svg]:text-current',
  ],
  {
    variants: {
      variant: {
        default: 'bg-card/70 backdrop-blur-md text-card-foreground border-separator1',
        destructive: [
          'text-white bg-gradient-to-r from-red-500/90 to-red-600/90 backdrop-blur-md border-red-400/50',
          '[&>svg]:text-current *:data-[slot=alert-description]:text-white/90',
        ],
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn('col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight', className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed',
        className
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
