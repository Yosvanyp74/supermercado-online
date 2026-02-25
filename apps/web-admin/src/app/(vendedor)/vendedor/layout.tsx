'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ShoppingCart, Package, History, LogOut, Home, Bell } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useNotificationsStore } from '@/store/notifications-store';
import { useQueryClient } from '@tanstack/react-query';
import { useSellerNotifications } from '../../../../hooks/useSellerNotifications';
import { Toaster } from 'sonner';
import { getSocket } from '@/lib/socket';

export default function VendedorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hydrate, clearAuth } = useAuthStore();

  // bring auth from localStorage when app starts
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // global socket invalidation for seller queries
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  // notifications hook manages toasts/sounds and additional invalidations
  useSellerNotifications();

  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);

    const invalidate = () => {
      queryClient.invalidateQueries();
    };

    socket.on('newOrder', invalidate);
    socket.on('orderStatusChanged', invalidate);
    socket.on('deliveryAssigned', invalidate);
    socket.on('orderCancelled', invalidate);

    return () => {
      socket.off('newOrder', invalidate);
      socket.off('orderStatusChanged', invalidate);
      socket.off('deliveryAssigned', invalidate);
      socket.off('orderCancelled', invalidate);
    };
  }, [accessToken, queryClient]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'SELLER') {
      router.push('/');
    }
  }, [user, router]);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const unreadCount = useNotificationsStore((s) => s.getUnreadCount());

  const navigation = [
    {
      name: 'Início',
      href: '/vendedor',
      icon: Home,
      current: pathname === '/vendedor',
    },
    {
      name: 'Pedidos Online',
      href: '/vendedor/pedidos',
      icon: Package,
      current: pathname.startsWith('/vendedor/pedidos'),
    },
    {
      name: 'Histórico',
      href: '/vendedor/historico',
      icon: History,
      current: pathname === '/vendedor/historico',
    },
  ];

  // Si no hay usuario o el rol no es vendedor, no mostrar nada
  if (!user || user.role !== 'SELLER') {
    return null;
  }

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        {/* toaster for seller notifications */}
        <Toaster position="top-right" richColors />
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Painel do Vendedor
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Olá, {user?.firstName || 'Vendedor'}
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* notification bell */}
                <button
                  onClick={() => router.push('/notifications')}
                  className="relative p-2 rounded-full hover:bg-gray-100 transition"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  <LogOut size={18} />
                  Sair
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center gap-2 px-3 py-4 text-sm font-medium border-b-2 transition
                      ${
                        item.current
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon size={18} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    );
}
