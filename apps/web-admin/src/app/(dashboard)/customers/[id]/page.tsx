'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MapPin, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PageLoading } from '@/components/ui/loading';
import { usersApi, ordersApi } from '@/lib/api/client';
import { formatDate, formatCurrency, getInitials, fullName } from '@/lib/utils';

const STATUS_MAP: Record<string, string> = {
  PENDING: 'Pendente', CONFIRMED: 'Confirmado', PREPARING: 'Preparando',
  READY: 'Pronto', IN_TRANSIT: 'Em Trânsito', DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado', REFUNDED: 'Reembolsado',
};

export default function CustomerDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const { data: userData, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => usersApi.findOne(id as string),
  });

  const { data: ordersData } = useQuery({
    queryKey: ['customer-orders', id],
    queryFn: () => ordersApi.findAll({ page: 1, limit: 10, customerId: id as string }),
    enabled: !!id,
  });

  const customer = userData?.data;
  const orders = ordersData?.data?.data || ordersData?.data || [];

  if (isLoading) return <PageLoading />;
  if (!customer) return <p className="text-center py-8 text-muted-foreground">Cliente não encontrado</p>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="h-4 w-4" />Voltar
      </Button>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardContent className="pt-6 text-center">
            <Avatar className="h-20 w-20 mx-auto mb-4">
              <AvatarFallback className="text-2xl">{getInitials(fullName(customer))}</AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold">{fullName(customer)}</h2>
            <Badge variant={customer.isActive !== false ? 'success' : 'secondary'} className="mt-2">
              {customer.isActive !== false ? 'Ativo' : 'Inativo'}
            </Badge>
            <div className="mt-6 space-y-3 text-left text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />{customer.email}
              </div>
              {customer.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />{customer.phone}
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShoppingCart className="h-4 w-4" />Membro desde {formatDate(customer.createdAt)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Últimos Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(orders) ? orders : []).map((order: any) => (
                  <TableRow key={order.id} className="cursor-pointer" onClick={() => router.push(`/orders/${order.id}`)}>
                    <TableCell className="font-mono text-sm">#{order.orderNumber || order.id?.slice(0, 8)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
                    <TableCell><Badge variant="outline">{STATUS_MAP[order.status] || order.status}</Badge></TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(order.total)}</TableCell>
                  </TableRow>
                ))}
                {(!Array.isArray(orders) || orders.length === 0) && (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum pedido</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {customer.addresses && customer.addresses.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Endereços</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {customer.addresses.map((addr: any, i: number) => (
                <div key={i} className="rounded-lg border p-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{addr.street}, {addr.number}</p>
                      {addr.complement && <p className="text-sm text-muted-foreground">{addr.complement}</p>}
                      <p className="text-sm text-muted-foreground">{addr.neighborhood} - {addr.city}/{addr.state}</p>
                      <p className="text-sm text-muted-foreground">CEP: {addr.zipCode}</p>
                      {addr.isDefault && <Badge variant="success" className="mt-1">Principal</Badge>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
