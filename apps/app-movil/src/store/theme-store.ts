import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeStoreState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  loadTheme: () => Promise<void>;
}

const THEME_KEY = '@supermercado:theme';

export const useThemeStore = create<ThemeStoreState>((set) => ({
  mode: 'system',

  setMode: async (mode: ThemeMode) => {
    set({ mode });
    try {
      await AsyncStorage.setItem(THEME_KEY, mode);
    } catch {}
  },

  loadTheme: async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        set({ mode: stored });
      }
    } catch {}
  },
}));
