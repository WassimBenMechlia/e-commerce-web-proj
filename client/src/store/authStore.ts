import { create } from 'zustand';

import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isBootstrapping: boolean;
  setUser: (user: User | null) => void;
  clearUser: () => void;
  setBootstrapping: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isBootstrapping: true,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
  setBootstrapping: (value) => set({ isBootstrapping: value }),
}));
