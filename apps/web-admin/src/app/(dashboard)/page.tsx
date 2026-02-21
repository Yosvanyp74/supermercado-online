'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/auth-store';
import {
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Users,
  TrendingUp,
  TrendingDown,
  Package,
  Truck,
  Percent,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageLoading } from '@/components/ui/loading';
import { analyticsApi, ordersApi, inventoryApi } from '@/lib/api/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const ORDER_STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info' }> = {
  PENDING: { label: 'Pendente', variant: 'warning' },
  CONFIRMED: { label: 'Confirmado', variant: 'info' },
  PROCESSING: { label: 'Processando', variant: 'info' },
  READY_FOR_PICKUP: { label: 'Pronto', variant: 'success' },
  OUT_FOR_DELIVERY: { label: 'Em entrega', variant: 'info' },
  DELIVERED: { label: 'Entregue', variant: 'success' },
  CANCELLED: { label: 'Cancelado', variant: 'destructive' },
  REFUNDED: { label: 'Reembolsado', variant: 'secondary' },
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  variant = 'default',
}: {
  title: string;
  value: string | number;
  change?: number;
  icon: any;
  variant?: 'default' | 'warning' | 'success' | 'destructive';
}) {
  const bgColors = {
    default: 'bg-blue-50 text-blue-600',
    warning: 'bg-yellow-50 text-yellow-600',
    success: 'bg-green-50 text-green-600',
    destructive: 'bg-red-50 text-red-600',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                {change >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span
                  className={`text-xs font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {change >= 0 ? '+' : ''}{change}%
                </span>
              </div>
            )}
          </div>
          <div className={`rounded-full p-3 ${bgColors[variant]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
    // Efecto para actualizar dashboard y pedidos recientes en tiempo real
    useEffect(() => {
      if (!accessToken) return;
      const socket = getSocket(accessToken);
      const handleOrderEvent = () => {
        queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['recent-orders'] });
      };
      socket.on('newOrder', handleOrderEvent);
      socket.on('orderStatusChanged', handleOrderEvent);
      socket.on('orderCancelled', handleOrderEvent);
      socket.on('orderReadyForPickup', handleOrderEvent);
      return () => {
        socket.off('newOrder', handleOrderEvent);
        socket.off('orderStatusChanged', handleOrderEvent);
        socket.off('orderCancelled', handleOrderEvent);
        socket.off('orderReadyForPickup', handleOrderEvent);
      };
    }, [accessToken, queryClient]);
  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => analyticsApi.getDashboard(),
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: () => ordersApi.findAll({ page: 1, limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
  });

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock-alerts'],
    queryFn: () => inventoryApi.getLowStock(),
  });

  const { data: revenueData } = useQuery({
    queryKey: ['revenue-chart'],
    queryFn: () => analyticsApi.getRevenueByDay(),
  });

  const { data: topProducts } = useQuery({
    queryKey: ['top-products-dashboard'],
    queryFn: () => analyticsApi.getTopProducts({ limit: 5 }),
  });

  const { data: marginData } = useQuery({
    queryKey: ['margin-dashboard'],
    queryFn: () => analyticsApi.getMarginDashboard(),
  });

  const stats = dashboard?.data;
  const orders = recentOrders?.data?.data || recentOrders?.data?.orders || [];
  const lowStockItems = lowStock?.data?.data || lowStock?.data || [];
  const revenueChartData = revenueData?.data?.data || revenueData?.data || [];
  const topProductsData = topProducts?.data?.data || topProducts?.data || [];
  const margin = marginData?.data;

  if (dashLoading) return <PageLoading />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do supermercado</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Vendas Hoje"
          value={formatCurrency(stats?.todaySales || stats?.totalRevenue || 0)}
          change={stats?.salesChange}
          icon={DollarSign}
          variant="success"
        />
        <StatsCard
          title="Pedidos Pendentes"
          value={stats?.pendingOrders || stats?.totalOrders || 0}
          icon={ShoppingCart}
        />
        <StatsCard
          title="Estoque Baixo"
          value={Array.isArray(lowStockItems) ? lowStockItems.length : 0}
          icon={AlertTriangle}
          variant="warning"
        />
        <StatsCard
          title="Clientes Ativos"
          value={stats?.activeCustomers || stats?.totalCustomers || 0}
          icon={Users}
        />
      </div>

      {/* Rentabilidad Section */}
      {margin && (
        <>
          <div>
            <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <Percent className="h-5 w-5 text-green-600" />
              Rentabilidade
            </h2>
            <p className="text-sm text-muted-foreground">Margen real baseado em vendas efetivas</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground">Margem Bruta Hoje</p>
                <p className={`text-2xl font-bold mt-1 ${(margin.today?.marginPercent || 0) >= 0.15 ? 'text-green-600' : (margin.today?.marginPercent || 0) >= 0.10 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {((margin.today?.marginPercent || 0) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(margin.today?.marginAmount || 0)} de margem
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground">Margem Bruta 7 Dias</p>
                <p className={`text-2xl font-bold mt-1 ${(margin.week?.marginPercent || 0) >= 0.15 ? 'text-green-600' : (margin.week?.marginPercent || 0) >= 0.10 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {((margin.week?.marginPercent || 0) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(margin.week?.marginAmount || 0)} de margem
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground">Vendas Hoje</p>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(margin.today?.revenue || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {margin.today?.orderCount || 0} pedidos
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground">Vendas 7 Dias</p>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(margin.week?.revenue || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {margin.week?.orderCount || 0} pedidos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Margin Trend Chart */}
          {Array.isArray(margin.dailyTrend) && margin.dailyTrend.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tendência de Rentabilidade (7 Dias)</CardTitle>
                <CardDescription>Receita vs Custo por dia</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={margin.dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => {
                        try { return new Date(v).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); } catch { return v; }
                      }}
                      fontSize={12}
                    />
                    <YAxis tickFormatter={(v) => `R$${v}`} fontSize={12} />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === 'revenue' ? 'Receita' : name === 'cost' ? 'Custo' : 'Margem',
                      ]}
                      labelFormatter={(label) => {
                        try { return new Date(label).toLocaleDateString('pt-BR'); } catch { return label; }
                      }}
                    />
                    <Bar dataKey="revenue" fill="#3b82f6" name="revenue" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cost" fill="#f59e0b" name="cost" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="margin" fill="#10b981" name="margin" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Receita dos Últimos 30 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={Array.isArray(revenueChartData) ? revenueChartData : []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    try {
                      return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    } catch {
                      return value;
                    }
                  }}
                  fontSize={12}
                />
                <YAxis
                  tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                  fontSize={12}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Receita']}
                  labelFormatter={(label) => {
                    try {
                      return new Date(label).toLocaleDateString('pt-BR');
                    } catch {
                      return label;
                    }
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
            <CardDescription>Top 5 do período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(Array.isArray(topProductsData) ? topProductsData : []).slice(0, 5).map((product: any, index: number) => (
                <div key={index} className="flex items-center gap-3">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name || product.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.totalSold || product.quantity} vendas
                    </p>
                  </div>
                  <p className="text-sm font-medium">
                    {formatCurrency(product.totalRevenue || product.revenue)}
                  </p>
                </div>
              ))}
              {(!Array.isArray(topProductsData) || topProductsData.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sem dados disponíveis
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pedidos Recentes</CardTitle>
              <CardDescription>Últimos pedidos do sistema</CardDescription>
            </div>
            <Link href="/orders">
              <Button variant="outline" size="sm">Ver todos</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(orders) ? orders : []).map((order: any) => {
                  const statusInfo = ORDER_STATUS_MAP[order.status] || { label: order.status, variant: 'secondary' as const };
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <Link href={`/orders/${order.id}`} className="hover:underline">
                          #{order.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {order.user?.firstName || order.customer?.name || '-'}
                      </TableCell>
                      <TableCell>{formatCurrency(order.total)}</TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!Array.isArray(orders) || orders.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhum pedido recente
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Alertas de Estoque</CardTitle>
              <CardDescription>Produtos com estoque baixo</CardDescription>
            </div>
            <Link href="/inventory">
              <Button variant="outline" size="sm">Ver todos</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Mínimo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(lowStockItems) ? lowStockItems : []).slice(0, 5).map((item: any) => (
                  <TableRow key={item.id || item.productId}>
                    <TableCell className="font-medium">
                      {item.name || item.product?.name || '-'}
                    </TableCell>
                    <TableCell>{item.stock ?? item.currentStock}</TableCell>
                    <TableCell>{item.minStock}</TableCell>
                    <TableCell>
                      <Badge variant={(item.stock ?? item.currentStock) === 0 ? 'destructive' : 'warning'}>
                        {(item.stock ?? item.currentStock) === 0 ? 'Esgotado' : 'Baixo'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(!Array.isArray(lowStockItems) || lowStockItems.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhum alerta de estoque
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
