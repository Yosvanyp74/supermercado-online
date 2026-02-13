import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cartApi } from '@/api';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  maxStock?: number;
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  couponCode: string | null;
  couponDiscount: number;

  // Computed
  totalItems: () => number;
  subtotal: () => number;
  total: () => number;

  // Actions
  loadCart: () => Promise<void>;
  addItem: (item: Omit<CartItem, 'id'>) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  syncCart: () => Promise<void>;
}

const CART_STORAGE_KEY = 'cart_items';

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,
  couponCode: null,
  couponDiscount: 0,

  totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

  subtotal: () =>
    get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

  total: () => {
    const subtotal = get().subtotal();
    return subtotal - get().couponDiscount;
  },

  loadCart: async () => {
    set({ isLoading: true });
    try {
      // Try loading from API first
      const { data } = await cartApi.get();
      if (data.items?.length) {
        const items: CartItem[] = data.items.map((item: any) => ({
          id: item.id,
          productId: item.productId || item.product?.id,
          name: item.product?.name || item.name,
          price: item.product?.price || item.price,
          quantity: item.quantity,
          image: item.product?.images?.[0] || item.image,
          maxStock: item.product?.stock || item.maxStock,
        }));
        set({ items, isLoading: false });
        return;
      }
    } catch {
      // Fallback to local storage
    }

    try {
      const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        set({ items: JSON.parse(stored) });
      }
    } catch {
      // Ignore storage errors
    }
    set({ isLoading: false });
  },

  addItem: async (item) => {
    const { items } = get();
    const existing = items.find((i) => i.productId === item.productId);

    let newItems: CartItem[];
    if (existing) {
      newItems = items.map((i) =>
        i.productId === item.productId
          ? { ...i, quantity: i.quantity + item.quantity }
          : i,
      );
    } else {
      newItems = [...items, { ...item, id: `local_${Date.now()}` }];
    }

    set({ items: newItems });
    await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));

    try {
      await cartApi.addItem({ productId: item.productId, quantity: item.quantity });
    } catch {
      // Keep local copy
    }
  },

  updateQuantity: async (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }

    const newItems = get().items.map((i) =>
      i.id === itemId ? { ...i, quantity } : i,
    );
    set({ items: newItems });
    await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));

    try {
      await cartApi.updateItem(itemId, { quantity });
    } catch {
      // Keep local copy
    }
  },

  removeItem: async (itemId) => {
    const newItems = get().items.filter((i) => i.id !== itemId);
    set({ items: newItems });
    await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));

    try {
      await cartApi.removeItem(itemId);
    } catch {
      // Keep local copy
    }
  },

  clearCart: () => {
    set({ items: [], couponCode: null, couponDiscount: 0 });
    AsyncStorage.removeItem(CART_STORAGE_KEY);
  },

  applyCoupon: (code, discount) => {
    set({ couponCode: code, couponDiscount: discount });
  },

  removeCoupon: () => {
    set({ couponCode: null, couponDiscount: 0 });
  },

  syncCart: async () => {
    const { items } = get();
    if (items.length > 0) {
      try {
        await cartApi.merge(
          items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        );
        const { data } = await cartApi.get();
        if (data.items?.length) {
          const serverItems: CartItem[] = data.items.map((item: any) => ({
            id: item.id,
            productId: item.productId || item.product?.id,
            name: item.product?.name || item.name,
            price: item.product?.price || item.price,
            quantity: item.quantity,
            image: item.product?.images?.[0] || item.image,
            maxStock: item.product?.stock || item.maxStock,
          }));
          set({ items: serverItems });
        }
      } catch {
        // Keep local
      }
    }
  },
}));
