'use client';


import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/auth-store';
import { useNotificationsStore } from '@/store/notifications-store';
import { toast } from 'sonner';
import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Setup WebSocket for notifications globally
  const accessToken = useAuthStore((s) => s.accessToken);
  const addNotification = useNotificationsStore((s) => s.addNotification);

  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);

    const handleNotification = (payload: any) => {
      // Add notification to store
      addNotification({
        id: payload.id || Date.now().toString(),
        type: payload.type || 'info',
        message: payload.message || 'Nova notificação',
        createdAt: payload.createdAt || new Date().toISOString(),
        data: payload,
        read: false,
      });
      // also show a toast so seller/admin notice immediately
      toast(payload.message || payload.body || 'Você tem uma nova notificação');
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
      // Optionally disconnectSocket();
    };
  }, [accessToken, addNotification]);

  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </QueryClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
