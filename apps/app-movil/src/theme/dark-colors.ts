import { colors as lightColors } from './colors';

type ColorValues = {
  [K in keyof typeof lightColors]: typeof lightColors[K] extends string
    ? string
    : typeof lightColors[K] extends Record<string, string>
      ? { [P in keyof typeof lightColors[K]]: string }
      : typeof lightColors[K];
};

// Dark mode colors — same shape as lightColors
export const darkColors: ColorValues = {
  // Primary (Green) — keeps identity but lighter tones for contrast
  primary: {
    50: '#052e16',
    100: '#14532d',
    200: '#166534',
    300: '#15803d',
    400: '#16a34a',
    500: '#22c55e',
    600: '#22c55e', // Main primary — brighter in dark
    700: '#4ade80',
    800: '#86efac',
    900: '#bbf7d0',
    950: '#dcfce7',
  },

  // Gray / Neutral — inverted scale
  gray: {
    50: '#111827',
    100: '#1f2937',
    200: '#374151',
    300: '#4b5563',
    400: '#6b7280',
    500: '#9ca3af',
    600: '#d1d5db',
    700: '#e5e7eb',
    800: '#f3f4f6',
    900: '#f9fafb',
    950: '#ffffff',
  },

  // Status colors — brighter/lighter for dark bg
  destructive: '#f87171',
  warning: '#fbbf24',
  success: '#4ade80',
  info: '#60a5fa',

  // Base — inverted
  white: '#111827',    // "white" surfaces → dark gray
  black: '#f9fafb',    // "black" text → near-white
  background: '#0a0a0a',
  foreground: '#fafafa',
  card: '#111827',
  cardForeground: '#fafafa',
  border: '#27272a',
  input: '#27272a',
  muted: '#1f2937',
  mutedForeground: '#9ca3af',
  accent: '#14532d',
  accentForeground: '#dcfce7',

  // Seller mode — darker variants
  seller: {
    primary: '#3b82f6',
    light: '#1e3a5f',
    background: '#0f1729',
    accent: '#1e3a5f',
  },

  // Admin mode
  admin: {
    primary: '#8b5cf6',
    light: '#2e1065',
    background: '#0f0720',
    accent: '#3b0764',
  },

  // Delivery mode
  delivery: {
    primary: '#fb923c',
    light: '#431407',
    background: '#1a0a00',
    accent: '#7c2d12',
  },

  // Picking mode
  picking: {
    pending: '#fbbf24',
    inProgress: '#60a5fa',
    completed: '#4ade80',
    substituted: '#a78bfa',
    notFound: '#f87171',
  },
} as const;
