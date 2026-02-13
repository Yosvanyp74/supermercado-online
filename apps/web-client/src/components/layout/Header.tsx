'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  LogOut,
  Package,
  MapPin,
  Star,
  Bell,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { useUIStore } from '@/store/ui-store';
import { useState } from 'react';

export function Header() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const items = useCartStore((s) => s.items);
  const { setCartDrawer, setMobileMenu, isMobileMenuOpen } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground text-xs py-1.5">
        <div className="container mx-auto flex items-center justify-between px-4">
          <span>Frete grátis para compras acima de R$ 150,00</span>
          <div className="hidden md:flex items-center gap-4">
            <Link href="/about" className="hover:underline">Sobre nós</Link>
            <Link href="/contact" className="hover:underline">Contato</Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenu(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-primary hidden sm:block">
              SuperMercado
            </span>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-4">
            <div className="relative w-full">
              <Input
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
              <button
                type="submit"
                title="Buscar"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => router.push('/search')}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Wishlist */}
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:flex"
                onClick={() => router.push('/account/wishlist')}
              >
                <Heart className="h-5 w-5" />
              </Button>
            )}

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setCartDrawer(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                  {itemCount}
                </Badge>
              )}
            </Button>

            {/* User menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <User className="h-4 w-4" />
                    <span className="hidden lg:inline text-sm">
                      {user?.firstName}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/account/profile')}>
                    <User className="mr-2 h-4 w-4" /> Meu Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/account/orders')}>
                    <Package className="mr-2 h-4 w-4" /> Meus Pedidos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/account/addresses')}>
                    <MapPin className="mr-2 h-4 w-4" /> Endereços
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/account/wishlist')}>
                    <Heart className="mr-2 h-4 w-4" /> Lista de Desejos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/account/loyalty')}>
                    <Star className="mr-2 h-4 w-4" /> Fidelidade
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/account/notifications')}>
                    <Bell className="mr-2 h-4 w-4" /> Notificações
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => router.push('/login')}>
                  Entrar
                </Button>
                <Button size="sm" onClick={() => router.push('/register')} className="hidden sm:flex">
                  Criar Conta
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation bar */}
      <nav className="hidden md:block border-t bg-gray-50">
        <div className="container mx-auto px-4">
          <ul className="flex items-center gap-6 text-sm py-2">
            <li>
              <Link href="/" className="hover:text-primary font-medium">Início</Link>
            </li>
            <li>
              <Link href="/products" className="hover:text-primary">Todos os Produtos</Link>
            </li>
            <li>
              <Link href="/products?isFeatured=true" className="hover:text-primary">Destaques</Link>
            </li>
            <li>
              <Link href="/products?isOrganic=true" className="hover:text-primary">Orgânicos</Link>
            </li>
            <li>
              <Link href="/products?sortBy=price&sortOrder=asc" className="text-destructive font-medium hover:text-destructive/80">
                Ofertas
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="container mx-auto px-4 py-4">
            <form onSubmit={handleSearch} className="mb-4">
              <Input
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <nav className="space-y-2">
              <Link
                href="/"
                className="block py-2 px-3 rounded-md hover:bg-gray-100"
                onClick={() => setMobileMenu(false)}
              >
                Início
              </Link>
              <Link
                href="/products"
                className="block py-2 px-3 rounded-md hover:bg-gray-100"
                onClick={() => setMobileMenu(false)}
              >
                Todos os Produtos
              </Link>
              <Link
                href="/products?isFeatured=true"
                className="block py-2 px-3 rounded-md hover:bg-gray-100"
                onClick={() => setMobileMenu(false)}
              >
                Destaques
              </Link>
              <Link
                href="/products?isOrganic=true"
                className="block py-2 px-3 rounded-md hover:bg-gray-100"
                onClick={() => setMobileMenu(false)}
              >
                Orgânicos
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
