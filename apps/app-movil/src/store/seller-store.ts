import { create } from 'zustand';

interface SellerState {
  isSellerMode: boolean;
  activeItems: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    barcode?: string;
    image?: string;
  }>;
  customerId: string | null;
  customerName: string | null;
  suspendedSaleId: string | null;

  // Computed
  saleTotal: () => number;
  saleItemCount: () => number;

  // Actions
  toggleSellerMode: () => void;
  addProduct: (product: {
    productId: string;
    name: string;
    price: number;
    barcode?: string;
    image?: string;
  }) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  removeProduct: (productId: string) => void;
  setCustomer: (id: string | null, name: string | null) => void;
  clearCustomer: () => void;
  clearSale: () => void;
  setSuspendedSaleId: (id: string | null) => void;
}

export const useSellerStore = create<SellerState>((set, get) => ({
  isSellerMode: false,
  activeItems: [],
  customerId: null,
  customerName: null,
  suspendedSaleId: null,

  saleTotal: () =>
    get().activeItems.reduce((sum, i) => sum + i.price * i.quantity, 0),

  saleItemCount: () =>
    get().activeItems.reduce((sum, i) => sum + i.quantity, 0),

  toggleSellerMode: () => set((s) => ({ isSellerMode: !s.isSellerMode })),

  addProduct: (product) => {
    const { activeItems } = get();
    const existing = activeItems.find((i) => i.productId === product.productId);

    if (existing) {
      set({
        activeItems: activeItems.map((i) =>
          i.productId === product.productId
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        ),
      });
    } else {
      set({
        activeItems: [...activeItems, { ...product, quantity: 1 }],
      });
    }
  },

  updateItemQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeProduct(productId);
      return;
    }
    set({
      activeItems: get().activeItems.map((i) =>
        i.productId === productId ? { ...i, quantity } : i,
      ),
    });
  },

  removeProduct: (productId) => {
    set({
      activeItems: get().activeItems.filter((i) => i.productId !== productId),
    });
  },

  setCustomer: (id, name) => set({ customerId: id, customerName: name }),

  clearCustomer: () => set({ customerId: null, customerName: null }),

  clearSale: () =>
    set({
      activeItems: [],
      customerId: null,
      customerName: null,
      suspendedSaleId: null,
    }),

  setSuspendedSaleId: (id) => set({ suspendedSaleId: id }),
}));
