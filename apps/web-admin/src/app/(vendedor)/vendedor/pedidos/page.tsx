'use client';

export const dynamic = 'force-dynamic';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { sellerApi } from '@/lib/api/client';
import { Package, Clock, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/auth-store';

// shape used in UI for both pending and picking orders
interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  itemCount: number;
  total: number;
  createdAt: string;
  deliveryMethod: string;
  status: string;
  // optional counts for items picked/total when available
  pickedItemsCount?: number;
  totalItemsCount?: number;
  minutesAgo?: number;
}

export default function PedidosPage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'picking'>('all');
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  // real‑time updates via socket
  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);
    const invalidate = () => {
      queryClient.invalidateQueries(['seller-orders']);
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

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['seller-orders', filter],
    queryFn: async () => {
      if (filter === 'pending') {
        const res = await sellerApi.getPendingOrders();
        // same shape as Order
        return res.data;
      }

      if (filter === 'picking') {
        const res = await sellerApi.getMyPickingOrders();
        // backend now returns simplified Order shape already, so just return it
        return res.data as Order[];
      }

      // all: combine both sets (pending + picking)
      const [pend, pick] = await Promise.all([
        sellerApi.getPendingOrders(),
        sellerApi.getMyPickingOrders(),
      ]);
      // pick.data already in the correct shape
      return [...pend.data, ...pick.data as Order[]];
    },
    refetchInterval: 10000,
  });


  return (
    <div className="space-y-6">
          {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pedidos Online</h1>
        <p className="text-gray-600 mt-1">
          Gerencie e prepare os pedidos dos clientes
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mt-4 flex space-x-4">
        {(['all', 'pending', 'picking'] as const).map((f) => {
          const label =
            f === 'all' ? 'Todos' : f === 'pending' ? 'Pendentes' : 'Em Preparação';
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={
                'px-4 py-2 rounded-lg font-medium ' +
                (active
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
              }
            >
              {label}
            </button>
          );
        })}
      </div>


      {/* Orders List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={40} />
          <p className="ml-3 text-gray-600">Carregando pedidos...</p>
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/vendedor/pedidos/${order.id}`}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-6 border border-gray-200"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">Pedido #{order.orderNumber}</p>
                  <p className="text-sm text-gray-600">{order.customerName}</p>
                  <p className="text-sm text-gray-600">
                    {order.itemCount} items • R$ {(
                      order.total ?? 0
                    ).toFixed(2)}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  Há {Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)} min
                  {filter === 'picking' && order.pickedItemsCount != null && (
                    <span className="ml-2 text-xs text-gray-400">
                      ({order.pickedItemsCount}/{order.totalItemsCount})
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Tudo pronto!
          </h3>
          <p className="text-gray-600">
            Não há pedidos pendentes no momento
          </p>
        </div>
      )}
    </div>
  );
}
