'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Package, Eye, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ordersApi } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils';

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Pendente', variant: 'outline' },
  CONFIRMED: { label: 'Confirmado', variant: 'secondary' },
  PREPARING: { label: 'Preparando', variant: 'secondary' },
  PICKING: { label: 'Separando', variant: 'secondary' },
  READY: { label: 'Pronto', variant: 'default' },
  OUT_FOR_DELIVERY: { label: 'Saiu para Entrega', variant: 'default' },
  DELIVERED: { label: 'Entregue', variant: 'default' },
  CANCELLED: { label: 'Cancelado', variant: 'destructive' },
  PROCESSING: { label: 'Processando', variant: 'secondary' },
  COMPLETED: { label: 'Concluído', variant: 'default' },
  FAILED: { label: 'Falhou', variant: 'destructive' },
  REFUNDED: { label: 'Reembolsado', variant: 'outline' },
};

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['myOrders'],
    queryFn: async () => {
      const res = await ordersApi.findMyOrders();
      return res.data;
    },
  });

  const orders = Array.isArray(data) ? data : data?.data || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Meus Pedidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">Você ainda não fez nenhum pedido</p>
              <Button asChild>
                <Link href="/products">Começar a Comprar</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order: any) => {
                const status = statusMap[order.status] || { label: order.status, variant: 'outline' as const };
                return (
                  <Link
                    key={order.id}
                    href={`/account/orders/${order.id}`}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <p className="font-medium">Pedido #{order.orderNumber || order.id.slice(0, 8)}</p>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('pt-BR')} &middot;{' '}
                        {order.items?.length || 0} item(ns)
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-primary">{formatCurrency(order.total)}</p>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
