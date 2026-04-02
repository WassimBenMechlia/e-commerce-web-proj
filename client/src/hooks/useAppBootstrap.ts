import { useEffect } from 'react';

import { api } from '@/lib/axios';
import type { AuthResponse, CartResponse } from '@/types/api';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';

export const useAppBootstrap = () => {
  const setUser = useAuthStore((state) => state.setUser);
  const clearUser = useAuthStore((state) => state.clearUser);
  const setBootstrapping = useAuthStore((state) => state.setBootstrapping);
  const setServerCart = useCartStore((state) => state.setServerCart);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      setBootstrapping(true);

      try {
        const { data } = await api.get<AuthResponse>('/auth/me');

        if (cancelled) {
          return;
        }

        setUser(data.user);

        try {
          const cartResponse = await api.get<CartResponse>('/cart');

          if (!cancelled) {
            setServerCart(cartResponse.data.cart);
          }
        } catch {
          if (!cancelled) {
            setServerCart(null);
          }
        }
      } catch {
        if (!cancelled) {
          clearUser();
          setServerCart(null);
        }
      } finally {
        if (!cancelled) {
          setBootstrapping(false);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [clearUser, setBootstrapping, setServerCart, setUser]);
};
