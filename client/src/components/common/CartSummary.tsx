import type { ReactNode } from 'react';

import { formatCurrency } from '@/lib/utils';

import { Card } from '../ui/Card';

interface CartSummaryProps {
  subtotal: number;
  itemCount: number;
  children?: ReactNode;
}

export const CartSummary = ({
  subtotal,
  itemCount,
  children,
}: CartSummaryProps) => {
  const shipping = subtotal > 150 ? 0 : 12;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return (
    <Card className="sticky top-28 grid gap-5 p-6">
      <div>
        <p className="font-serif text-sm uppercase tracking-[0.3em] text-text-secondary">
          Summary
        </p>
        <h3 className="mt-2 font-heading text-2xl text-text-primary">
          {itemCount} items in your cart
        </h3>
      </div>
      <dl className="grid gap-3 text-sm text-text-secondary">
        <div className="flex items-center justify-between">
          <dt>Subtotal</dt>
          <dd className="text-text-primary">{formatCurrency(subtotal)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt>Estimated shipping</dt>
          <dd className="text-text-primary">{formatCurrency(shipping)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt>Estimated tax</dt>
          <dd className="text-text-primary">{formatCurrency(tax)}</dd>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3 text-base">
          <dt className="font-semibold text-text-primary">Estimated total</dt>
          <dd className="font-semibold text-text-primary">{formatCurrency(total)}</dd>
        </div>
      </dl>
      {children}
    </Card>
  );
};
