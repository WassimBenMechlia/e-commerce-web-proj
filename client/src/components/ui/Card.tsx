import type { HTMLAttributes, PropsWithChildren } from 'react';

import { cn } from '@/lib/utils';

export const Card = ({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) => (
  <div
    className={cn(
      'rounded-card border border-border bg-background-secondary shadow-soft',
      className,
    )}
    {...props}
  >
    {children}
  </div>
);
