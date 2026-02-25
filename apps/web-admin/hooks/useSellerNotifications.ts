'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSocket, disconnectSocket } from '@/lib/socket';

export const useSellerNotifications = () => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!session?.user || session.user.role !== 'SELLER') {
      return;
    }

    const socket = getSocket(session.accessToken);

    const invalidateStats = () => {
      queryClient.invalidateQueries({ queryKey: ['seller-stats'] });
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      queryClient.invalidateQueries({ queryKey: ['pending-orders-preview'] });
      queryClient.invalidateQueries({ queryKey: ['picking-orders'] });
    };

    const handleNewOrder = (order: any) => {
      playNotificationSound('new-order');
      toast.success('🛒 Novo pedido recebido!', {
        description: `Pedido #${order.orderNumber} - ${order.items?.length || 0} items - R$ ${order.total?.toFixed(2) || '0.00'}`,
        duration: 8000,
        action: {
          label: 'Ver Pedido',
          onClick: () => {
            window.location.href = `/vendedor/pedidos/${order.id}`;
          },
        },
      });
      invalidateStats();
    };

    const handleOrderCancelled = (data: any) => {
      playNotificationSound('cancelled');
      toast.error('❌ Pedido cancelado', {
        description: `Pedido #${data.orderNumber} foi cancelado`,
        duration: 5000,
      });
      invalidateStats();
    };

    const handleStatusChange = (data: any) => {
      const statusMessages: Record<string, { emoji: string; title: string; description: string }> = {
        ASSIGNED: {
          emoji: '🚗',
          title: 'Entregador atribuído',
          description: `${data.driverName || 'Um entregador'} aceitou o pedido #${data.orderNumber}`,
        },
        OUT_FOR_DELIVERY: {
          emoji: '📦',
          title: 'Pedido saiu para entrega',
          description: `Pedido #${data.orderNumber} está a caminho do cliente`,
        },
        DELIVERED: {
          emoji: '✅',
          title: 'Pedido entregue',
          description: `Pedido #${data.orderNumber} foi entregue com sucesso`,
        },
        READY_FOR_PICKUP: {
          emoji: '🏪',
          title: 'Pronto para retirada',
          description: `Pedido #${data.orderNumber} aguarda retirada do cliente`,
        },
      };

      const message = statusMessages[data.status];
      if (message) {
        playNotificationSound('status-change');
        toast.info(`${message.emoji} ${message.title}`, {
          description: message.description,
          duration: 5000,
        });
        invalidateStats();
      }
    };

    const handleItemPicked = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['order', data.orderId] });
    };

    const handlePickingCompleted = (data: any) => {
      playNotificationSound('beep-success');
      toast.success('✅ Pedido finalizado!', {
        description: `Pedido #${data.orderNumber} está pronto`,
        duration: 5000,
      });
      invalidateStats();
      queryClient.invalidateQueries({ queryKey: ['order', data.orderId] });
    };

    socket.on('newOrder', handleNewOrder);
    socket.on('orderCancelled', handleOrderCancelled);
    socket.on('orderStatusChanged', handleStatusChange);
    socket.on('order:item-picked', handleItemPicked);
    socket.on('order:picking-completed', handlePickingCompleted);

    return () => {
      socket.off('newOrder', handleNewOrder);
      socket.off('orderCancelled', handleOrderCancelled);
      socket.off('orderStatusChanged', handleStatusChange);
      socket.off('order:item-picked', handleItemPicked);
      socket.off('order:picking-completed', handlePickingCompleted);
      disconnectSocket();
    };
  }, [session, queryClient]);
};

const playNotificationSound = (
  type: 'new-order' | 'cancelled' | 'status-change' | 'beep-success' | 'beep-error'
) => {
  const sounds: Record<string, string> = {
    'new-order': '/sounds/new-order.mp3',
    'cancelled': '/sounds/cancelled.mp3',
    'status-change': '/sounds/notification.mp3',
    'beep-success': '/sounds/beep-success.mp3',
    'beep-error': '/sounds/beep-error.mp3',
  };

  const audio = new Audio(sounds[type]);
  audio.volume = 0.6;
  audio.play().catch((error) => {
    console.error('Error al reproducir sonido:', error);
  });
};
