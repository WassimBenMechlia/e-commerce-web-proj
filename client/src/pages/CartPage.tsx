import { ShoppingBag, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { PageTransition } from '@/components/common/PageTransition';
import { CartSummary } from '@/components/common/CartSummary';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/axios';
import { formatCurrency, getErrorMessage } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import type { CartResponse } from '@/types/api';

export const CartPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const serverCart = useCartStore((state) => state.serverCart);
  const guestItems = useCartStore((state) => state.guestItems);
  const setServerCart = useCartStore((state) => state.setServerCart);
  const updateGuestItem = useCartStore((state) => state.updateGuestItem);
  const removeGuestItem = useCartStore((state) => state.removeGuestItem);

  const items = user
    ? serverCart?.items ?? []
    : guestItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        product: {
          id: item.id,
          name: item.name,
          slug: item.slug,
          price: item.price,
          stock: item.stock,
          image: item.image,
          isActive: item.isActive,
        },
      }));

  const subtotal = user
    ? serverCart?.subtotal ?? 0
    : guestItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const itemCount = user
    ? serverCart?.itemCount ?? 0
    : guestItems.reduce((sum, item) => sum + item.quantity, 0);

  const updateServerItem = async (itemId: string, quantity: number) => {
    try {
      const { data } = await api.put<CartResponse>(`/cart/update/${itemId}`, {
        quantity,
      });
      setServerCart(data.cart);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const removeServerItem = async (itemId: string) => {
    try {
      const { data } = await api.delete<CartResponse>(`/cart/remove/${itemId}`);
      setServerCart(data.cart);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (items.length === 0) {
    return (
      <section className="page-shell">
        <PageTransition>
          <EmptyState
            eyebrow="Cart"
            title="Your cart is still quiet."
            description="Save a few products to keep moving through the checkout flow and test the persistent cart experience."
            icon={<ShoppingBag className="h-6 w-6" />}
            actionLabel="Browse products"
            onAction={() => navigate('/shop')}
          />
        </PageTransition>
      </section>
    );
  }

  return (
    <PageTransition>
      <section className="page-shell grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id} className="grid gap-5 p-5 md:grid-cols-[120px_1fr]">
              <img
                src={item.product.image}
                alt={item.product.name}
                className="aspect-square w-full rounded-card object-cover"
              />
              <div className="grid gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl text-text-primary">{item.product.name}</h2>
                    <p className="text-sm text-text-secondary">
                      {formatCurrency(item.product.price)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      user ? removeServerItem(item.id) : removeGuestItem(item.product.id)
                    }
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border"
                    aria-label="Remove cart item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      user
                        ? updateServerItem(item.id, Math.max(1, item.quantity - 1))
                        : updateGuestItem(
                            item.product.id,
                            Math.max(1, item.quantity - 1),
                          )
                    }
                  >
                    -
                  </Button>
                  <span>{item.quantity}</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      user
                        ? updateServerItem(
                            item.id,
                            Math.min(item.product.stock, item.quantity + 1),
                          )
                        : updateGuestItem(
                            item.product.id,
                            Math.min(item.product.stock, item.quantity + 1),
                          )
                    }
                  >
                    +
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <CartSummary itemCount={itemCount} subtotal={subtotal}>
          {user ? (
            <Button onClick={() => navigate('/checkout')}>Proceed to checkout</Button>
          ) : (
            <Button onClick={() => navigate('/login', { state: { from: '/checkout' } })}>
              Log in to checkout
            </Button>
          )}
        </CartSummary>
      </section>
    </PageTransition>
  );
};
