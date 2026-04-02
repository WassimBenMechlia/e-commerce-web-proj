import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

import { PageTransition } from '@/components/common/PageTransition';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/axios';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import type { OrderResponse, OrdersResponse } from '@/types/api';

export const CheckoutSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const setServerCart = useCartStore((state) => state.setServerCart);
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('orderId');

  const orderQuery = useQuery({
    queryKey: ['checkout-success', sessionId, orderId],
    queryFn: async () => {
      if (sessionId) {
        const { data } = await api.get<OrderResponse>(
          `/orders/confirm?sessionId=${encodeURIComponent(sessionId)}`,
        );
        return data.order;
      }

      const { data } = await api.get<OrdersResponse>('/orders/my-orders');
      return data.orders.find((order) => order._id === orderId) ?? data.orders[0] ?? null;
    },
    enabled: Boolean(sessionId || orderId),
  });

  useEffect(() => {
    if (!orderQuery.data) {
      return;
    }

    setServerCart({
      id: null,
      itemCount: 0,
      subtotal: 0,
      items: [],
    });
  }, [orderQuery.data, setServerCart]);

  return (
    <PageTransition>
      <section className="page-shell">
        <Card className="mx-auto grid max-w-3xl gap-6 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-accent/10 text-brand-accent">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div className="space-y-3">
            <p className="font-serif text-sm uppercase tracking-[0.3em] text-text-secondary">
              Order confirmed
            </p>
            <h1 className="text-4xl">Your checkout is complete.</h1>
          </div>

          {orderQuery.isLoading ? (
            <Skeleton className="h-48 rounded-card" />
          ) : orderQuery.data ? (
            <div className="grid gap-4 rounded-card bg-background-primary p-6 text-left">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-text-secondary">Order number</p>
                  <p className="font-medium text-text-primary">
                    {orderQuery.data.orderNumber}
                  </p>
                </div>
                <p className="text-sm text-text-secondary">
                  {formatDate(orderQuery.data.createdAt)}
                </p>
              </div>
              <div className="grid gap-3">
                {orderQuery.data.items.map((item) => (
                  <div key={item._id} className="flex items-center justify-between gap-3">
                    <p className="text-text-primary">
                      {item.quantity} x {item.name}
                    </p>
                    <p className="text-text-secondary">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4">
                <p className="font-medium text-text-primary">
                  Total {formatCurrency(orderQuery.data.totalAmount)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-text-secondary">
              The order was created, but the confirmation payload is not available yet.
            </p>
          )}

          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/profile">
              <Button>View profile</Button>
            </Link>
            <Link to="/shop">
              <Button variant="secondary">Continue shopping</Button>
            </Link>
          </div>
        </Card>
      </section>
    </PageTransition>
  );
};
