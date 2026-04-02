import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { PageTransition } from '@/components/common/PageTransition';
import { CartSummary } from '@/components/common/CartSummary';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/axios';
import { formatCurrency, getErrorMessage } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import type { Address } from '@/types';
import type { OrderResponse } from '@/types/api';

const blankAddress: Address = {
  label: 'Shipping',
  fullName: '',
  line1: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  phone: '',
};

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const cart = useCartStore((state) => state.serverCart);
  const setServerCart = useCartStore((state) => state.setServerCart);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultAddress = useMemo(
    () => user?.addresses.find((address) => address.isDefault) ?? user?.addresses[0],
    [user?.addresses],
  );

  const [address, setAddress] = useState<Address>(defaultAddress ?? blankAddress);

  useEffect(() => {
    if (defaultAddress) {
      setAddress(defaultAddress);
    }
  }, [defaultAddress]);

  if (!cart || cart.items.length === 0) {
    return (
      <section className="page-shell">
        <PageTransition>
          <EmptyState
            eyebrow="Checkout"
            title="There is nothing ready to check out."
            description="Add products to your cart before creating an order."
            actionLabel="Return to shop"
            onAction={() => navigate('/shop')}
          />
        </PageTransition>
      </section>
    );
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const { data } = await api.post<OrderResponse>('/orders', {
        shippingAddress: address,
        note,
      });

      if (data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
        return;
      }

      setServerCart({
        id: null,
        itemCount: 0,
        subtotal: 0,
        items: [],
      });
      toast.success('Order created successfully.');
      navigate(`/checkout/success?simulated=1&orderId=${data.order?._id ?? ''}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <section className="page-shell grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-6">
          <Card className="grid gap-5 p-6">
            <div>
              <p className="font-serif text-sm uppercase tracking-[0.3em] text-text-secondary">
                Checkout
              </p>
              <h1 className="mt-2 text-3xl">Shipping details</h1>
            </div>

            {user?.addresses.length ? (
              <div className="grid gap-3">
                <p className="text-sm text-text-secondary">Saved addresses</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {user.addresses.map((savedAddress) => (
                    <button
                      type="button"
                      key={`${savedAddress.label}-${savedAddress.line1}`}
                      onClick={() => setAddress(savedAddress)}
                      className="rounded-card border border-border bg-background-primary p-4 text-left"
                    >
                      <p className="font-medium text-text-primary">
                        {savedAddress.label}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {savedAddress.fullName}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {savedAddress.line1}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Label"
                value={address.label}
                onChange={(event) =>
                  setAddress((current) => ({ ...current, label: event.target.value }))
                }
              />
              <Input
                label="Full Name"
                value={address.fullName}
                onChange={(event) =>
                  setAddress((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
              />
              <Input
                label="Address Line 1"
                value={address.line1}
                onChange={(event) =>
                  setAddress((current) => ({ ...current, line1: event.target.value }))
                }
              />
              <Input
                label="Address Line 2"
                value={address.line2 ?? ''}
                onChange={(event) =>
                  setAddress((current) => ({ ...current, line2: event.target.value }))
                }
              />
              <Input
                label="City"
                value={address.city}
                onChange={(event) =>
                  setAddress((current) => ({ ...current, city: event.target.value }))
                }
              />
              <Input
                label="State"
                value={address.state}
                onChange={(event) =>
                  setAddress((current) => ({ ...current, state: event.target.value }))
                }
              />
              <Input
                label="Postal Code"
                value={address.postalCode}
                onChange={(event) =>
                  setAddress((current) => ({
                    ...current,
                    postalCode: event.target.value,
                  }))
                }
              />
              <Input
                label="Country"
                value={address.country}
                onChange={(event) =>
                  setAddress((current) => ({ ...current, country: event.target.value }))
                }
              />
              <Input
                label="Phone"
                value={address.phone}
                onChange={(event) =>
                  setAddress((current) => ({ ...current, phone: event.target.value }))
                }
              />
            </div>

            <label className="grid gap-2 text-sm text-text-secondary">
              Delivery note
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={4}
                className="rounded-input border border-border bg-background-primary px-4 py-3 text-text-primary outline-none"
              />
            </label>
          </Card>

          <Card className="grid gap-3 p-6">
            <h2 className="text-2xl">Review items</h2>
            {cart.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 rounded-card bg-background-primary p-4">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="h-16 w-16 rounded-card object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium text-text-primary">{item.product.name}</p>
                  <p className="text-sm text-text-secondary">
                    {item.quantity} x {formatCurrency(item.product.price)}
                  </p>
                </div>
              </div>
            ))}
          </Card>
        </div>

        <CartSummary itemCount={cart.itemCount} subtotal={cart.subtotal}>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Pay with Stripe
          </Button>
        </CartSummary>
      </section>
    </PageTransition>
  );
};
