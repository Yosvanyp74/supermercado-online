'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/auth-store';
import { useState as useReactState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Eye, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableLoading } from '@/components/ui/loading';
import { ordersApi } from '@/lib/api/client';
import { formatCurrency, formatDate } from '@/lib/utils';

const ORDER_STATUS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info' }> = {
  PENDING: { label: 'Pendente', variant: 'warning' },
  CONFIRMED: { label: 'Confirmado', variant: 'info' },
  PROCESSING: { label: 'Processando', variant: 'info' },
  READY_FOR_PICKUP: { label: 'Pronto para Retirada', variant: 'success' },
  OUT_FOR_DELIVERY: { label: 'Em Entrega', variant: 'info' },
  DELIVERED: { label: 'Entregue', variant: 'success' },
  CANCELLED: { label: 'Cancelado', variant: 'destructive' },
  REFUNDED: { label: 'Reembolsado', variant: 'secondary' },
};

export default function OrdersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const [deleteDialog, setDeleteDialog] = useReactState<{ open: boolean; orderId?: string }>({ open: false });
  const deleteMutation = useMutation({
    mutationFn: (orderId: string) => ordersApi.deleteOrder(orderId),
    onSuccess: () => {
      toast.success('Pedido eliminado com sucesso');
      setDeleteDialog({ open: false });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: any) => {
      toast.error('Erro ao eliminar pedido');
      setDeleteDialog({ open: false });
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, statusFilter],
    queryFn: () =>
      ordersApi.findAll({
        page,
        limit: 10,
        status: statusFilter === 'all' ? undefined : statusFilter,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
  });


  const orders = data?.data?.data || data?.data?.orders || data?.data || [];
  const totalPages = data?.data?.meta?.totalPages || data?.data?.totalPages || 1;

  // Real-time WebSocket subscription
  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);

    const handleOrderEvent = (payload: any) => {
      // Refetch orders on relevant events
      queryClient.invalidateQueries({ queryKey: ['orders'] });
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
      // Optionally disconnect if needed
      // disconnectSocket();
    };
  }, [accessToken, queryClient]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
        <p className="text-muted-foreground">Gerencie os pedidos do supermercado</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Select
              value={statusFilter}
              onValueChange={(v) => { setStatusFilter(v); setPage(1); }}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(ORDER_STATUS).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{val.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableLoading />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[70px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(orders) ? orders : []).map((order: any) => {
                    const statusInfo = ORDER_STATUS[order.status] || { label: order.status, variant: 'secondary' as const };
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          <Link href={`/orders/${order.id}`} className="hover:underline text-primary">
                            #{order.orderNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {order.user?.firstName} {order.user?.lastName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(order.total)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {order.fulfillmentType === 'DELIVERY' ? 'Entrega' : 'Retirada'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/orders/${order.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {user?.role === 'ADMIN' && (
                            <Button
                              variant="destructive"
                              size="icon"
                              disabled={deleteMutation.status === 'pending' && deleteDialog.orderId === order.id}
                              onClick={() => setDeleteDialog({ open: true, orderId: order.id })}
                              title="Eliminar pedido"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                        {/* Diálogo de confirmação para eliminar pedido */}
                        {deleteDialog.open && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
                              <h2 className="text-lg font-semibold mb-2">Confirmar eliminação</h2>
                              <p className="mb-4">Tem certeza que deseja eliminar este pedido? Esta ação não pode ser desfeita.</p>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setDeleteDialog({ open: false })} disabled={deleteMutation.status === 'pending'}>
                                  Cancelar
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => deleteDialog.orderId && deleteMutation.mutate(deleteDialog.orderId)}
                                  disabled={deleteMutation.status === 'pending'}
                                >
                                  {deleteMutation.status === 'pending' ? 'Eliminando...' : 'Eliminar'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                  {(!Array.isArray(orders) || orders.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Nenhum pedido encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">Página {page} de {totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Anterior</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>Próxima</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
