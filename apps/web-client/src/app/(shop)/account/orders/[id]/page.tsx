'use client';

import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ArrowLeft, Package, CheckCircle, XCircle, Clock, Truck, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ordersApi } from '@/lib/api/client';
import { formatCurrency, getImageUrl } from '@/lib/utils';
import { toast } from 'sonner';

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  PENDING: { label: 'Pendente', variant: 'outline', icon: <Clock className="h-4 w-4" /> },
  CONFIRMED: { label: 'Confirmado', variant: 'secondary', icon: <CheckCircle className="h-4 w-4" /> },
  PREPARING: { label: 'Preparando', variant: 'secondary', icon: <Package className="h-4 w-4" /> },
  PICKING: { label: 'Separando', variant: 'secondary', icon: <Package className="h-4 w-4" /> },
  READY: { label: 'Pronto', variant: 'default', icon: <Package className="h-4 w-4" /> },
  OUT_FOR_DELIVERY: { label: 'Saiu para Entrega', variant: 'default', icon: <Truck className="h-4 w-4" /> },
  DELIVERED: { label: 'Entregue', variant: 'default', icon: <CheckCircle className="h-4 w-4" /> },
  CANCELLED: { label: 'Cancelado', variant: 'destructive', icon: <XCircle className="h-4 w-4" /> },
  PROCESSING: { label: 'Processando', variant: 'secondary', icon: <Clock className="h-4 w-4" /> },
  COMPLETED: { label: 'Concluído', variant: 'default', icon: <CheckCircle className="h-4 w-4" /> },
  FAILED: { label: 'Falhou', variant: 'destructive', icon: <XCircle className="h-4 w-4" /> },
  REFUNDED: { label: 'Reembolsado', variant: 'outline', icon: <Clock className="h-4 w-4" /> },
};

export default function OrderDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const orderId = params.id as string;
  const isSuccess = searchParams.get('success') === 'true';

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const res = await ordersApi.findOne(orderId);
      return res.data;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => ordersApi.cancel(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      toast.success('Pedido cancelado');
    },
    onError: () => toast.error('Não foi possível cancelar o pedido'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Pedido não encontrado</p>
        <Button asChild variant="ghost" className="mt-4">
          <Link href="/account/orders">Voltar</Link>
        </Button>
      </div>
    );
  }

  const status = statusMap[order.status] || { label: order.status, variant: 'outline' as const, icon: null };
  const canCancel = ['PENDING', 'CONFIRMED'].includes(order.status);

  return (
    <div className="space-y-6">
      {isSuccess && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 flex items-center gap-3">
          <CheckCircle className="h-5 w-5" />
          <div>
            <p className="font-medium">Pedido realizado com sucesso!</p>
            <p className="text-sm">Acompanhe o status do seu pedido abaixo.</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild size="sm">
          <Link href="/account/orders"><ArrowLeft className="h-4 w-4 mr-2" /> Meus Pedidos</Link>
        </Button>
        {canCancel && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? 'Cancelando...' : 'Cancelar Pedido'}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pedido #{order.orderNumber || order.id.slice(0, 8)}</CardTitle>
            <Badge variant={status.variant} className="flex items-center gap-1">
              {status.icon} {status.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Realizado em {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Delivery Info */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Entrega
            </h4>
            {order.fulfillmentType === 'PICKUP' ? (
              <p className="text-sm">Retirada na loja</p>
            ) : order.deliveryAddress ? (
              <p className="text-sm">
                {order.deliveryAddress.street}, {order.deliveryAddress.number}
                {order.deliveryAddress.complement && ` - ${order.deliveryAddress.complement}`},{' '}
                {order.deliveryAddress.neighborhood}, {order.deliveryAddress.city} - {order.deliveryAddress.state}
              </p>
            ) : (
              <p className="text-sm">Entrega a domicílio</p>
            )}
          </div>

          <Separator />

          {/* Items */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Itens do Pedido</h4>
            <div className="space-y-3">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="relative h-14 w-14 rounded bg-gray-100 overflow-hidden shrink-0">
                    <Image
                      src={getImageUrl(item.product?.images?.[0]?.url)}
                      alt={item.product?.name || 'Produto'}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{item.product?.name || 'Produto'}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity}x {formatCurrency(item.price)}
                    </p>
                  </div>
                  <p className="text-sm font-bold">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal || order.total)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Desconto</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Frete</span>
              <span>{order.shippingCost === 0 ? <span className="text-green-600">Grátis</span> : formatCurrency(order.shippingCost || 0)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
