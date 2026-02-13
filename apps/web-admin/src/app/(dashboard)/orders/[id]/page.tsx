'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Printer } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PageLoading } from '@/components/ui/loading';
import { ordersApi } from '@/lib/api/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useState } from 'react';

const ORDER_STATUS_LIST = [
  { value: 'PENDING', label: 'Pendente' },
  { value: 'CONFIRMED', label: 'Confirmado' },
  { value: 'PROCESSING', label: 'Processando' },
  { value: 'READY_FOR_PICKUP', label: 'Pronto para Retirada' },
  { value: 'OUT_FOR_DELIVERY', label: 'Em Entrega' },
  { value: 'DELIVERED', label: 'Entregue' },
  { value: 'CANCELLED', label: 'Cancelado' },
  { value: 'REFUNDED', label: 'Reembolsado' },
];

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info'> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PROCESSING: 'info',
  READY_FOR_PICKUP: 'success',
  OUT_FOR_DELIVERY: 'info',
  DELIVERED: 'success',
  CANCELLED: 'destructive',
  REFUNDED: 'secondary',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState('');

  const { data: orderData, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.findOne(id),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => ordersApi.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Status atualizado com sucesso');
      setNewStatus('');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao atualizar status');
    },
  });

  const order = orderData?.data;

  if (isLoading) return <PageLoading />;
  if (!order) return <div className="py-8 text-center text-muted-foreground">Pedido não encontrado</div>;

  const statusLabel = ORDER_STATUS_LIST.find((s) => s.value === order.status)?.label || order.status;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/orders">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pedido #{order.orderNumber}</h1>
            <p className="text-muted-foreground">Criado em {formatDate(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANT[order.status] || 'secondary'} className="text-sm px-3 py-1">
            {statusLabel}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Items */}
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Itens do Pedido</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Preço Unit.</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(order.items || []).map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.product?.name || item.productName || '-'}
                    </TableCell>
                    <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCurrency(item.total || item.unitPrice * item.quantity)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Separator className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Impostos:</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
              )}
              {order.deliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Entrega:</span>
                  <span>{formatCurrency(order.deliveryFee)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Desconto:</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Update Status */}
          <Card>
            <CardHeader><CardTitle>Atualizar Status</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger><SelectValue placeholder="Selecionar novo status" /></SelectTrigger>
                <SelectContent>
                  {ORDER_STATUS_LIST.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="w-full"
                onClick={() => newStatus && updateStatusMutation.mutate(newStatus)}
                disabled={!newStatus || updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? 'Atualizando...' : 'Atualizar Status'}
              </Button>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader><CardTitle>Cliente</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{order.user?.firstName} {order.user?.lastName}</p>
              <p className="text-sm text-muted-foreground">{order.user?.email}</p>
              <p className="text-sm text-muted-foreground">{order.user?.phone}</p>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          {order.deliveryAddress && (
            <Card>
              <CardHeader><CardTitle>Endereço de Entrega</CardTitle></CardHeader>
              <CardContent>
                <address className="text-sm not-italic text-muted-foreground">
                  {order.deliveryAddress.street}, {order.deliveryAddress.number}<br />
                  {order.deliveryAddress.neighborhood}<br />
                  {order.deliveryAddress.city} - {order.deliveryAddress.state}<br />
                  CEP: {order.deliveryAddress.zipCode}
                </address>
              </CardContent>
            </Card>
          )}

          {/* Payment */}
          <Card>
            <CardHeader><CardTitle>Pagamento</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tipo:</span>
                <span>{order.fulfillmentType === 'DELIVERY' ? 'Entrega' : 'Retirada'}</span>
              </div>
              {order.notes && (
                <div className="mt-2">
                  <span className="text-sm font-medium">Observações:</span>
                  <p className="text-sm text-muted-foreground mt-1">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
