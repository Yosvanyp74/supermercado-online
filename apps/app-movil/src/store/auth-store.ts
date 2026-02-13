import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi, TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
  loyaltyPoints?: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSeller: boolean;
  isAdmin: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isSeller: false,
  isAdmin: false,

  login: async (email, password) => {
    const { data } = await authApi.login({ email, password });
    await SecureStore.setItemAsync(TOKEN_KEY, data.accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
    set({
      user: data.user,
      isAuthenticated: true,
      isSeller: data.user.role === 'SELLER' || data.user.role === 'ADMIN',
      isAdmin: data.user.role === 'ADMIN',
    });
  },

  register: async (registerData) => {
    const { data } = await authApi.register(registerData);
    await SecureStore.setItemAsync(TOKEN_KEY, data.accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
    set({
      user: data.user,
      isAuthenticated: true,
      isSeller: false,
    });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout API errors
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    set({ user: null, isAuthenticated: false, isSeller: false, isAdmin: false });
  },

  loadUser: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const { data } = await authApi.getMe();
      set({
        user: data,
        isAuthenticated: true,
        isSeller: data.role === 'SELLER' || data.role === 'ADMIN',
        isAdmin: data.role === 'ADMIN',
        isLoading: false,
      });
    } catch {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) =>
    set({
      user,
      isSeller: user.role === 'SELLER' || user.role === 'ADMIN',
      isAdmin: user.role === 'ADMIN',
    }),
}));
