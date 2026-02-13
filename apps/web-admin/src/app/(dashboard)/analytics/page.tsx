'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, Users, DollarSign, ShoppingCart, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageLoading } from '@/components/ui/loading';
import { analyticsApi } from '@/lib/api/client';
import { formatCurrency, formatNumber } from '@/lib/utils';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#2563eb', '#16a34a', '#ea580c', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#6366f1'];

export default function AnalyticsPage() {
  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['analytics-sales'],
    queryFn: () => analyticsApi.getSales(),
  });

  const { data: topProductsData } = useQuery({
    queryKey: ['analytics-top-products'],
    queryFn: () => analyticsApi.getTopProducts(),
  });

  const { data: customerData } = useQuery({
    queryKey: ['analytics-customers'],
    queryFn: () => analyticsApi.getCustomerAnalytics(),
  });

  const { data: revenueData } = useQuery({
    queryKey: ['analytics-revenue'],
    queryFn: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      return analyticsApi.getRevenueByDay({
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      });
    },
  });

  const { data: sellerData } = useQuery({
    queryKey: ['analytics-sellers'],
    queryFn: () => analyticsApi.getSellerPerformance(),
  });

  const sales = salesData?.data || {};
  const topProducts = topProductsData?.data?.data || topProductsData?.data || [];
  const customers = customerData?.data || {};
  const revenueByDay = revenueData?.data?.data || revenueData?.data || [];
  const sellers = sellerData?.data?.data || sellerData?.data || [];

  if (salesLoading) return <PageLoading />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Análises e relatórios do supermercado</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { title: 'Receita Total', value: formatCurrency(sales.totalRevenue || 0), icon: DollarSign, color: 'text-green-600' },
          { title: 'Total de Pedidos', value: formatNumber(sales.totalOrders || 0), icon: ShoppingCart, color: 'text-blue-600' },
          { title: 'Ticket Médio', value: formatCurrency(sales.averageOrderValue || 0), icon: TrendingUp, color: 'text-purple-600' },
          { title: 'Total Clientes', value: formatNumber(customers.totalCustomers || sales.totalCustomers || 0), icon: Users, color: 'text-orange-600' },
        ].map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue">Receita</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
          <TabsTrigger value="sellers">Vendedores</TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />Receita dos Últimos 30 Dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(revenueByDay) && revenueByDay.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={revenueByDay}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => {
                      const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`;
                    }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => [formatCurrency(v), 'Receita']}
                      labelFormatter={(v) => new Date(v).toLocaleDateString('pt-BR')} />
                    <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2}
                      dot={false} activeDot={{ r: 4 }} name="Receita" />
                    <Line type="monotone" dataKey="orders" stroke="#16a34a" strokeWidth={2}
                      dot={false} name="Pedidos" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center py-12 text-muted-foreground">Sem dados de receita</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Top Produtos por Vendas</CardTitle></CardHeader>
              <CardContent>
                {Array.isArray(topProducts) && topProducts.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topProducts.slice(0, 8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="totalSold" fill="#2563eb" radius={[0, 4, 4, 0]} name="Vendas" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center py-12 text-muted-foreground">Sem dados</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Top Produtos por Receita</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Vendas</TableHead>
                      <TableHead className="text-right">Receita</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(topProducts) ? topProducts.slice(0, 10) : []).map((p: any, i: number) => (
                      <TableRow key={p.id || i}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-right">{formatNumber(p.totalSold || 0)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(p.totalRevenue || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Resumo de Clientes</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Total de Clientes', value: formatNumber(customers.totalCustomers || 0) },
                    { label: 'Novos (último mês)', value: formatNumber(customers.newCustomers || 0) },
                    { label: 'Clientes Ativos', value: formatNumber(customers.activeCustomers || 0) },
                    { label: 'Taxa de Retenção', value: `${(customers.retentionRate || 0).toFixed(1)}%` },
                    { label: 'Valor Médio por Cliente', value: formatCurrency(customers.averageCustomerValue || 0) },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Distribuição por Frequência</CardTitle></CardHeader>
              <CardContent>
                {customers.distribution && Array.isArray(customers.distribution) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={customers.distribution} dataKey="value" nameKey="name" cx="50%" cy="50%"
                        outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {customers.distribution.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center py-12 text-muted-foreground">Sem dados de distribuição</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sellers Tab */}
        <TabsContent value="sellers">
          <Card>
            <CardHeader><CardTitle>Performance dos Vendedores</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor</TableHead>
                    <TableHead className="text-right">Pedidos</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                    <TableHead className="text-right">Ticket Médio</TableHead>
                    <TableHead className="text-right">Avaliação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(sellers) ? sellers : []).map((seller: any, i: number) => (
                    <TableRow key={seller.id || i}>
                      <TableCell className="font-medium">{seller.name || seller.sellerName}</TableCell>
                      <TableCell className="text-right">{formatNumber(seller.totalOrders || 0)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(seller.totalRevenue || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(seller.averageOrderValue || 0)}</TableCell>
                      <TableCell className="text-right">
                        {seller.rating ? (
                          <Badge variant="success">{seller.rating.toFixed(1)}</Badge>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!Array.isArray(sellers) || sellers.length === 0) && (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Sem dados</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
