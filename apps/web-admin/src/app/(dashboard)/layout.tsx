'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';
import { cn } from '@/lib/utils';
import { PageLoading } from '@/components/ui/loading';

import { useNotificationsStore } from '@/store/notifications-store';
import { getSocket, disconnectSocket } from '@/lib/socket';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, hydrate, user } = useAuthStore();
  const { sidebarCollapsed } = useUIStore();

  const accessToken = useAuthStore((s) => s.accessToken);
  const addNotification = useNotificationsStore((s) => s.addNotification);
  const notifications = useNotificationsStore((s) => s.notifications);
  const clearNotifications = useNotificationsStore((s) => s.clearNotifications);
  const queryClient = useQueryClient();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Hidratar notificaciones no leídas al cargar
  useEffect(() => {
    async function hydrateNotifications() {
      try {
        if (!accessToken) return;
        const res = await notificationsApi.findAll({ isRead: false });
        clearNotifications();
        const notifs = res?.data?.data || res?.data || [];
        notifs.forEach((n: any) => {
          addNotification({
            id: n.id,
            type: n.type,
            message: n.message || n.body,
            createdAt: n.createdAt,
            data: n.data,
            read: n.isRead || n.read || false,
          });
        });
      } catch (e) {
        // ignore
      }
    }
    hydrateNotifications();
    // Solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // redirect unauthenticated users or those with wrong role
  useEffect(() => {
    // wait until store is hydrated (hydrate effect above picks up tokens)
    if (!user) {
      router.push('/login');
      return;
    }

    // if logged user is a seller, send them to their dashboard
    if (user.role === 'SELLER') {
      router.push('/vendedor');
      return;
    }

    // other roles are permitted to stay (ADMIN, MANAGER, EMPLOYEE, etc.)
  }, [user, router]);

  // Global socket connection for notifications
  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);

    const handleNotification = (payload: any) => {
      // Solo agregar si el id existe y no está ya en el store
      if (!payload.id) return;
      const exists = notifications.some((n: any) => n.id === payload.id);
      if (exists) return;
      addNotification({
        id: payload.id,
        type: payload.type,
        message: payload.message || payload.body,
        createdAt: payload.createdAt,
        data: payload.data,
        read: false,
      });
      // Solo actualiza el store, la lista se actualiza en la página de notificaciones
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
      // Optionally disconnect if needed
      // disconnectSocket();
    };
  }, [accessToken, addNotification]);

  if (typeof window !== 'undefined' && !localStorage.getItem('accessToken')) {
    return <PageLoading />;
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <Sidebar />
      <div
        className={cn(
          'transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <Header />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
