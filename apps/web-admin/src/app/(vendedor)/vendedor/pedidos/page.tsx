'use client';

export const dynamic = 'force-dynamic';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useRouter } from 'next/navigation';
import { sellerApi } from '@/lib/api/client';
import { Package, Clock, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';

// shape used in UI for both pending and picking orders
interface Order {
  id: string;
  pickingOrderId?: string;
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
  const [confirmOrderId, setConfirmOrderId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const router = useRouter();



  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['seller-orders', filter],
    queryFn: async () => {
      if (filter === 'pending') {
        const res = await sellerApi.getPendingOrders();
        return res.data;
      }
      if (filter === 'picking') {
        const res = await sellerApi.getMyPickingOrders();
        return res.data as Order[];
      }
      const [pend, pick] = await Promise.all([
        sellerApi.getPendingOrders(),
        sellerApi.getMyPickingOrders(),
      ]);
      return [...pend.data, ...pick.data as Order[]];
    },
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
          {orders.map((order) => {
            const isPicking = !!order.pickingOrderId;
            const detailId = order.pickingOrderId || order.id;
            const handleClick = async () => {
              if (isPicking) {
                router.push(`/vendedor/pedidos/${detailId}`);
              } else {
                setConfirmOrderId(order.id);
              }
            };
            return (
              <button
                key={detailId}
                onClick={handleClick}
                className="w-full text-left bg-white rounded-lg shadow-sm hover:shadow-md transition p-6 border border-gray-200"
                style={{ cursor: 'pointer' }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Pedido #{order.orderNumber}</p>
                    <p className="text-sm text-gray-600">{order.customerName}</p>
                    <p className="text-sm text-gray-600">
                      {order.itemCount} items • R$ {(order.total ?? 0).toFixed(2)}
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
              </button>
            );
          })}
          {/* Confirmación elegante para aceptar pedido */}
          <ConfirmDialog
            open={!!confirmOrderId}
            title="Aceptar pedido"
            description="¿Desea aceptar este pedido y comenzar la preparación?"
            confirmText="Aceptar"
            cancelText="Cancelar"
            onCancel={() => setConfirmOrderId(null)}
            onConfirm={async () => {
              if (!confirmOrderId) return;
              setConfirming(true);
              try {
                const res = await sellerApi.acceptOrder(confirmOrderId);
                const pickingOrderId = res.data.pickingOrderId || res.data.id || confirmOrderId;
                setConfirmOrderId(null);
                router.push(`/vendedor/pedidos/${pickingOrderId}`);
                queryClient.invalidateQueries({ queryKey: ['seller-orders', filter] });
                queryClient.invalidateQueries({ queryKey: ['picking-orders'] });
                queryClient.invalidateQueries({ queryKey: ['pending-orders-preview'] });
              } catch (err) {
                alert('Erro ao aceitar pedido. Tente novamente.');
              } finally {
                setConfirming(false);
              }
            }}
          />
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
// ...existing code up to ConfirmDialog and su return principal...
