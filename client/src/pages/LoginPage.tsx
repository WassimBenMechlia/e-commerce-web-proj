import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { PageTransition } from '@/components/common/PageTransition';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/axios';
import { getErrorMessage } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import type { AuthResponse } from '@/types/api';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useAuthStore((state) => state.setUser);
  const guestItems = useCartStore((state) => state.guestItems);
  const setServerCart = useCartStore((state) => state.setServerCart);
  const clearGuestCart = useCartStore((state) => state.clearGuestCart);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const { data } = await api.post<AuthResponse>('/auth/login', {
        email,
        password,
        guestCart: guestItems.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      });
      setUser(data.user);
      setServerCart(data.cart ?? null);
      clearGuestCart();
      toast.success('Signed in successfully.');
      navigate((location.state as { from?: string } | null)?.from ?? '/');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <section className="page-shell flex justify-center">
        <Card className="w-full max-w-lg grid gap-6 p-8">
          <div>
            <p className="font-serif text-sm uppercase tracking-[0.3em] text-text-secondary">
              Welcome back
            </p>
            <h1 className="mt-2 text-4xl">Sign in</h1>
          </div>
          <div className="grid gap-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <Link to="/forgot-password" className="text-text-secondary">
              Forgot password?
            </Link>
            <Link to="/register" className="text-brand-primary">
              Create an account
            </Link>
          </div>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Log In
          </Button>
        </Card>
      </section>
    </PageTransition>
  );
};
