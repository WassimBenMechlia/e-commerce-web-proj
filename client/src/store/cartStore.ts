import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { emptyCart } from '@/lib/constants';
import type { Cart, GuestCartItem } from '@/types';

interface CartState {
  serverCart: Cart | null;
  guestItems: GuestCartItem[];
  setServerCart: (cart: Cart | null) => void;
  addGuestItem: (item: GuestCartItem) => void;
  updateGuestItem: (productId: string, quantity: number) => void;
  removeGuestItem: (productId: string) => void;
  clearGuestCart: () => void;
  clearServerCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      serverCart: null,
      guestItems: [],
      setServerCart: (cart) => set({ serverCart: cart ?? emptyCart }),
      addGuestItem: (item) =>
        set((state) => {
          const existing = state.guestItems.find(
            (guestItem) => guestItem.id === item.id,
          );

          if (existing) {
            return {
              guestItems: state.guestItems.map((guestItem) =>
                guestItem.id === item.id
                  ? {
                      ...guestItem,
                      quantity: Math.min(
                        guestItem.quantity + item.quantity,
                        guestItem.stock,
                      ),
                    }
                  : guestItem,
              ),
            };
          }

          return {
            guestItems: [...state.guestItems, item],
          };
        }),
      updateGuestItem: (productId, quantity) =>
        set((state) => ({
          guestItems: state.guestItems.map((guestItem) =>
            guestItem.id === productId
              ? {
                  ...guestItem,
                  quantity: Math.max(1, Math.min(quantity, guestItem.stock)),
                }
              : guestItem,
          ),
        })),
      removeGuestItem: (productId) =>
        set((state) => ({
          guestItems: state.guestItems.filter((item) => item.id !== productId),
        })),
      clearGuestCart: () => set({ guestItems: [] }),
      clearServerCart: () => set({ serverCart: null }),
    }),
    {
      name: 'desert-modern-guest-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        guestItems: state.guestItems,
      }),
    },
  ),
);
