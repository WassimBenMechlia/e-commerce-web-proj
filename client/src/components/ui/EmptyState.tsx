import type { ReactNode } from 'react';

import { Button } from './Button';
import { Card } from './Card';

interface EmptyStateProps {
  eyebrow: string;
  title: string;
  description: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({
  eyebrow,
  title,
  description,
  icon,
  actionLabel,
  onAction,
}: EmptyStateProps) => (
  <Card className="grid gap-5 p-8 text-center">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-background-tertiary text-text-primary">
      {icon}
    </div>
    <div className="space-y-2">
      <p className="font-serif text-sm uppercase tracking-[0.3em] text-text-secondary">
        {eyebrow}
      </p>
      <h3 className="font-heading text-2xl text-text-primary">{title}</h3>
      <p className="mx-auto max-w-xl text-text-secondary">{description}</p>
    </div>
    {actionLabel && onAction ? (
      <div className="flex justify-center">
        <Button onClick={onAction}>{actionLabel}</Button>
      </div>
    ) : null}
  </Card>
);
