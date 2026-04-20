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

type RequiredAddressField =
  | 'label'
  | 'fullName'
  | 'line1'
  | 'city'
  | 'state'
  | 'postalCode'
  | 'country'
  | 'phone';

type AddressErrors = Partial<Record<RequiredAddressField, string>>;

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

const sanitizeAddress = (value: Address): Address => ({
  label: value.label.trim(),
  fullName: value.fullName.trim(),
  line1: value.line1.trim(),
  line2: value.line2?.trim() ? value.line2.trim() : undefined,
  city: value.city.trim(),
  state: value.state.trim(),
  postalCode: value.postalCode.trim(),
  country: value.country.trim(),
  phone: value.phone.trim(),
});

const validateAddress = (value: Address): AddressErrors => {
  const errors: AddressErrors = {};

  if (!value.label.trim()) {
    errors.label = 'Label is required.';
  }

  if (!value.fullName.trim()) {
    errors.fullName = 'Full name is required.';
  }

  if (!value.line1.trim()) {
    errors.line1 = 'Address line 1 is required.';
  }

  if (!value.city.trim()) {
    errors.city = 'City is required.';
  }

  if (!value.state.trim()) {
    errors.state = 'State is required.';
  }

  if (!value.postalCode.trim()) {
    errors.postalCode = 'Postal code is required.';
  }

  if (!value.country.trim()) {
    errors.country = 'Country is required.';
  }

  const phoneValue = value.phone.trim();
  if (!phoneValue) {
    errors.phone = 'Phone is required.';
  } else if (phoneValue.length < 6) {
    errors.phone = 'Phone must be at least 6 characters.';
  }

  return errors;
};

const requiredAddressFields: RequiredAddressField[] = [
  'label',
  'fullName',
  'line1',
  'city',
  'state',
  'postalCode',
  'country',
  'phone',
];

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const cart = useCartStore((state) => state.serverCart);
  const setServerCart = useCartStore((state) => state.setServerCart);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addressErrors, setAddressErrors] = useState<AddressErrors>({});

  const defaultAddress = useMemo(
    () => user?.addresses.find((address) => address.isDefault) ?? user?.addresses[0],
    [user?.addresses],
  );

  const [address, setAddress] = useState<Address>(defaultAddress ?? blankAddress);

  useEffect(() => {
    if (defaultAddress) {
      setAddress(defaultAddress);
      setAddressErrors({});
    }
  }, [defaultAddress]);

  const setAddressValue = (field: keyof Address, value: string) => {
    setAddress((current) => ({ ...current, [field]: value }));

    if (!requiredAddressFields.includes(field as RequiredAddressField)) {
      return;
    }

    const requiredField = field as RequiredAddressField;
    setAddressErrors((current) => {
      if (!current[requiredField]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[requiredField];
      return nextErrors;
    });
  };

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
    const normalizedAddress = sanitizeAddress(address);
    const nextErrors = validateAddress(normalizedAddress);

    if (Object.keys(nextErrors).length > 0) {
      setAddressErrors(nextErrors);
      toast.error('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data } = await api.post<OrderResponse>('/orders', {
        shippingAddress: normalizedAddress,
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
                      onClick={() => {
                        setAddress(savedAddress);
                        setAddressErrors({});
                      }}
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
                label="* Label"
                value={address.label}
                required
                error={addressErrors.label}
                onChange={(event) => setAddressValue('label', event.target.value)}
              />
              <Input
                label="* Full Name"
                value={address.fullName}
                required
                error={addressErrors.fullName}
                onChange={(event) => setAddressValue('fullName', event.target.value)}
              />
              <Input
                label="* Address Line 1"
                value={address.line1}
                required
                error={addressErrors.line1}
                onChange={(event) => setAddressValue('line1', event.target.value)}
              />
              <Input
                label="Address Line 2"
                value={address.line2 ?? ''}
                onChange={(event) => setAddressValue('line2', event.target.value)}
              />
              <Input
                label="* City"
                value={address.city}
                required
                error={addressErrors.city}
                onChange={(event) => setAddressValue('city', event.target.value)}
              />
              <Input
                label="* State"
                value={address.state}
                required
                error={addressErrors.state}
                onChange={(event) => setAddressValue('state', event.target.value)}
              />
              <Input
                label="* Postal Code"
                value={address.postalCode}
                required
                error={addressErrors.postalCode}
                onChange={(event) => setAddressValue('postalCode', event.target.value)}
              />
              <Input
                label="* Country"
                value={address.country}
                required
                error={addressErrors.country}
                onChange={(event) => setAddressValue('country', event.target.value)}
              />
              <Input
                label="* Phone"
                value={address.phone}
                required
                error={addressErrors.phone}
                onChange={(event) => setAddressValue('phone', event.target.value)}
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
