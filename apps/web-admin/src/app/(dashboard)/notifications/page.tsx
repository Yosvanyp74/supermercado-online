'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/auth-store';
import { Bell, Check, CheckCheck, Trash2, Info, AlertTriangle, Package, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PageLoading } from '@/components/ui/loading';
import { notificationsApi } from '@/lib/api/client';
import { useNotificationsStore } from '@/store/notifications-store';
import { formatDate } from '@/lib/utils';

const ICON_MAP: Record<string, any> = {
  ORDER: ShoppingCart, STOCK: Package, ALERT: AlertTriangle, INFO: Info,
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.findAll(),
  });

  // Actualizar la lista en tiempo real
  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);
    const handleNotification = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };
    socket.on('notification', handleNotification);
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [accessToken, queryClient]);

  const markAsRead = useNotificationsStore((s) => s.markAsRead);
  const markAllAsReadStore = useNotificationsStore((s) => s.markAllAsRead);

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (id) markAsRead(id);
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      markAllAsReadStore();
      toast.success('Todas marcadas como lidas');
    },
  });

  const notifications = data?.data?.data || data?.data || [];
  const unreadCount = Array.isArray(notifications) ? notifications.filter((n: any) => !n.isRead && !n.read).length : 0;

  if (isLoading) return <PageLoading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notificações</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Todas lidas'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={() => markAllReadMutation.mutate()}>
            <CheckCheck className="mr-2 h-4 w-4" />Marcar todas como lidas
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          {(!Array.isArray(notifications) || notifications.length === 0) ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification: any, i: number) => {
                const isRead = notification.isRead || notification.read;
                const IconComp = ICON_MAP[notification.type] || Info;
                return (
                  <div key={notification.id}>
                    <div className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${!isRead ? 'bg-accent/50' : 'hover:bg-muted/50'}`}>
                      <div className={`mt-1 rounded-full p-2 ${!isRead ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        <IconComp className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={`text-sm ${!isRead ? 'font-semibold' : ''}`}>{notification.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message || notification.body}</p>
                          </div>
                          {!isRead && (
                            <div className="flex-shrink-0">
                              <div className="h-2 w-2 rounded-full bg-primary" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground">{formatDate(notification.createdAt)}</span>
                          {!isRead && (
                            <Button variant="ghost" size="sm" className="h-6 text-xs px-2"
                              onClick={() => markReadMutation.mutate(notification.id)}>
                              <Check className="h-3 w-3 mr-1" />Marcar como lida
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    {i < notifications.length - 1 && <Separator />}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
