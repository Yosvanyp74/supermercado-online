'use client';

export const dynamic = 'force-dynamic';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { sellerApi } from '@/lib/api/client';
import { 
  ShoppingCart, 
  Package, 
  DollarSign, 
  TrendingUp,
  Clock,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/auth-store';

interface SellerStats {
  todaySales: number;
  todayOrders: number;
  averageTicket: number;
  itemsSold: number;
  pendingPickingOrders: number;
  availableOrdersCount: number;
}

interface PendingOrder {
  id: string;
  orderNumber: string;
  // some endpoints return a nested customer object, others a plain name
  customer?: {
    name: string;
  };
  customerName?: string;
  itemCount?: number;
  items?: unknown[]; // kept generic, not using `any`
  total: number;
  createdAt: string;
  minutesAgo: number;
}

export default function VendedorHomePage() {
  // Fetch de estadísticas
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  const { data: stats, isLoading: statsLoading } = useQuery<SellerStats>({
    queryKey: ['seller-stats'],
    queryFn: async () => {
      const res = await sellerApi.getStats();
      return res.data;
    },
  });

  // Fetch de pedidos pendentes (últimos 5)
  const { data: pendingOrders, isLoading: ordersLoading } = useQuery<PendingOrder[]>({
    queryKey: ['pending-orders-preview'],
    queryFn: async () => {
      const res = await sellerApi.getPendingOrders({ limit: 5 });
      return res.data;
    },
  });

  // Fetch actual picking orders assigned to me
  const { data: pickingOrders, isLoading: pickingLoading } = useQuery<PendingOrder[]>({
    queryKey: ['picking-orders'],
    queryFn: async () => {
      const res = await sellerApi.getMyPickingOrders();
      console.debug('debug pickingOrders response', res.data);
      return res.data;
    },
  });

  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['seller-stats'] });
      queryClient.invalidateQueries({ queryKey: ['pending-orders-preview'] });
      queryClient.invalidateQueries({ queryKey: ['picking-orders'] });
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

  // Cards de estadísticas
  const statCards = [
    {
      name: 'Vendas Hoje',
      value: `R$ ${(stats?.todaySales || 0).toFixed(2)}`,
      icon: DollarSign,
      bgColor: 'bg-green-500',
      textColor: 'text-green-600',
      lightBg: 'bg-green-50',
    },
    {
      name: 'Pedidos Hoje',
      value: stats?.todayOrders || 0,
      icon: ShoppingCart,
      bgColor: 'bg-blue-500',
      textColor: 'text-blue-600',
      lightBg: 'bg-blue-50',
    },
    {
      name: 'Em preparação',
      // prefer real list length in case stats not updated yet
      value: (pickingOrders?.length ?? stats?.pendingPickingOrders) || 0,
      icon: Clock,
      bgColor: 'bg-indigo-500',
      textColor: 'text-indigo-600',
      lightBg: 'bg-indigo-50',
    },
    {
      name: 'Pedidos Disponíveis',
      value: stats?.availableOrdersCount ?? pendingOrders?.length ?? 0,
      icon: Package,
      bgColor: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      lightBg: 'bg-yellow-50',
    },
    {
      name: 'Ticket Médio',
      value: `R$ ${(stats?.averageTicket || 0).toFixed(2)}`,
      icon: TrendingUp,
      bgColor: 'bg-purple-500',
      textColor: 'text-purple-600',
      lightBg: 'bg-purple-50',
    },
    {
      name: 'Items Vendidos',
      value: stats?.itemsSold || 0,
      icon: Package,
      bgColor: 'bg-orange-500',
      textColor: 'text-orange-600',
      lightBg: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-3xl font-bold mt-2 text-gray-900">
                    {statsLoading ? '...' : stat.value}
                  </p>
                </div>
                <div className={`${stat.lightBg} p-3 rounded-lg`}>
                  <Icon className={stat.textColor} size={28} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alerta de Pedidos Pendentes */}
{(stats && (stats.availableOrdersCount ?? pendingOrders?.length) > 0) && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="text-yellow-600 mr-3 flex-shrink-0" size={24} />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    {(stats.availableOrdersCount ?? pendingOrders?.length) || 0} pedido{(stats.availableOrdersCount ?? pendingOrders?.length) > 1 ? 's' : ''} disponível{(stats.availableOrdersCount ?? pendingOrders?.length) > 1 ? 's' : ''} para aceitar
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Clique para ver e aceitar os pedidos
                </p>
              </div>
            </div>
            <Link
              href="/vendedor/pedidos"
              className="flex items-center gap-2 text-sm font-medium text-yellow-800 hover:text-yellow-900"
            >
              Ver Pedidos
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* Pedidos Pendentes Recentes */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Pedidos Pendentes</h2>
            {pendingOrders && pendingOrders.length > 0 && (
              <Link
                href="/vendedor/pedidos"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Ver todos
              </Link>
            )}
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {ordersLoading ? (
            <div className="px-6 py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Carregando pedidos...</p>
            </div>
          ) : pendingOrders && pendingOrders.length > 0 ? (
            pendingOrders.map((order) => (
              <Link
                key={order.id}
                href={`/vendedor/pedidos/${order.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Package className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Pedido #{order.orderNumber}</p>
                    <p className="text-sm text-gray-600">
                      {order.customerName || 'Cliente'} • {order.itemCount} items
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold text-gray-900">R$ {order.total.toFixed(2)}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-1 justify-end">
                    <Clock size={14} />
                    Há {Math.floor((Date.now() - new Date(order.createdAt).getTime())/60000)} min
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <Package size={48} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 font-medium">Nenhum pedido pendente</p>
              <p className="text-sm text-gray-500 mt-1">
                Novos pedidos aparecerão aqui automaticamente
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pedidos que estoy preparando */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Meus Pedidos em Preparação</h2>
          {pickingOrders && pickingOrders.length > 0 && (
            <Link
              href="/vendedor/pedidos"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Ver todos
            </Link>
          )}
        </div>
        <div className="divide-y divide-gray-200">
          {pickingLoading ? (
            <div className="px-6 py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Carregando pedidos...</p>
            </div>
          ) : pickingOrders && pickingOrders.length > 0 ? (
            pickingOrders.map((order) => (
              <Link
                key={order.id}
                href={`/vendedor/pedidos/${order.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Package className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Pedido #{order.orderNumber}</p>
                    <p className="text-sm text-gray-600">
                      {order.customerName || 'Cliente'} • {order.itemCount} items
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">R$ {order.total.toFixed(2)}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-1 justify-end">
                    <Clock size={14} />
                    Há {Math.floor((Date.now() - new Date(order.createdAt).getTime())/60000)} min
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <Package size={48} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 font-medium">Nenhum pedido em preparação</p>
              <p className="text-sm text-gray-500 mt-1">
                Os pedidos que você aceitou aparecerão aqui
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/vendedor/pedidos"
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-8 hover:shadow-xl transition text-white group"
        >
          <Package className="mb-4 group-hover:scale-110 transition" size={40} />
          <h3 className="font-bold text-xl mb-2">Preparar Pedidos</h3>
          <p className="text-blue-100 text-sm">
            Ver e preparar pedidos online dos clienti...          Ver e preparar pedidos online dos clientes
          </p>
        </Link>

        <div className="bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg shadow-lg p-8 text-white">
          <ShoppingCart className="mb-4 opacity-50" size={40} />
          <h3 className="font-bold text-xl mb-2 opacity-75">Nova Venda (Em breve)</h3>
          <p className="text-gray-200 text-sm opacity-75">
            POS para vendas presenciais no balcão
          </p>
        </div>
      </div>
    </div>
  );
}
