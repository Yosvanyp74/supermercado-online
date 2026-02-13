import { create } from 'zustand';

interface UIState {
  isMobileMenuOpen: boolean;
  isCartDrawerOpen: boolean;
  isSearchOpen: boolean;
  toggleMobileMenu: () => void;
  setMobileMenu: (open: boolean) => void;
  toggleCartDrawer: () => void;
  setCartDrawer: (open: boolean) => void;
  toggleSearch: () => void;
  setSearch: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMobileMenuOpen: false,
  isCartDrawerOpen: false,
  isSearchOpen: false,

  toggleMobileMenu: () => set((s) => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),
  setMobileMenu: (open) => set({ isMobileMenuOpen: open }),
  toggleCartDrawer: () => set((s) => ({ isCartDrawerOpen: !s.isCartDrawerOpen })),
  setCartDrawer: (open) => set({ isCartDrawerOpen: open }),
  toggleSearch: () => set((s) => ({ isSearchOpen: !s.isSearchOpen })),
  setSearch: (open) => set({ isSearchOpen: open }),
}));
