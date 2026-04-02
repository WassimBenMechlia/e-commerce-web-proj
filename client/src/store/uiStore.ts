import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ThemeMode } from '@/types';

interface UiState {
  theme: ThemeMode;
  mobileMenuOpen: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  setMobileMenuOpen: (value: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'light',
      mobileMenuOpen: false,
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),
      setTheme: (theme) => set({ theme }),
      setMobileMenuOpen: (value) => set({ mobileMenuOpen: value }),
    }),
    {
      name: 'desert-modern-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
      }),
    },
  ),
);
