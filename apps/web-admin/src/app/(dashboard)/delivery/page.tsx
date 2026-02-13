'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Truck, MapPin, Clock, CheckCircle, User } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TableLoading } from '@/components/ui/loading';
import { deliveryApi } from '@/lib/api/client';
import { formatDate } from '@/lib/utils';

const DELIVERY_STATUS: Record<string, string> = {
  PENDING: 'Pendente', ASSIGNED: 'Atribuído', PICKED_UP: 'Coletado',
  IN_TRANSIT: 'Em Trânsito', DELIVERED: 'Entregue', FAILED: 'Falhou',
};
const DELIVERY_VARIANTS: Record<string, 'warning' | 'info' | 'success' | 'destructive' | 'secondary'> = {
  PENDING: 'warning', ASSIGNED: 'info', PICKED_UP: 'info',
  IN_TRANSIT: 'warning', DELIVERED: 'success', FAILED: 'destructive',
};

export default function DeliveryPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('active');
  const [showAssign, setShowAssign] = useState<string | null>(null);
  const [driverId, setDriverId] = useState('');
  const [showStatus, setShowStatus] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');

  const { data: activeData, isLoading } = useQuery({
    queryKey: ['deliveries-active'],
    queryFn: () => deliveryApi.getActive(),
    enabled: tab === 'active',
  });

  const { data: allData, isLoading: allLoading } = useQuery({
    queryKey: ['deliveries-all'],
    queryFn: () => deliveryApi.getActive(),
    enabled: tab === 'all',
  });

  const assignMutation = useMutation({
    mutationFn: () => deliveryApi.assign({ orderId: showAssign!, deliveryPersonId: driverId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries-active'] });
      toast.success('Entregador atribuído');
      setShowAssign(null);
      setDriverId('');
    },
    onError: () => toast.error('Erro ao atribuir entregador'),
  });

  const statusMutation = useMutation({
    mutationFn: () => deliveryApi.updateStatus(showStatus.id, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries-active'] });
      queryClient.invalidateQueries({ queryKey: ['deliveries-all'] });
      toast.success('Status atualizado');
      setShowStatus(null);
    },
    onError: () => toast.error('Erro ao atualizar status'),
  });

  const activeDeliveries = activeData?.data?.data || activeData?.data || [];
  const allDeliveries = allData?.data?.data || allData?.data || [];

  const renderTable = (deliveries: any[], loading: boolean) => {
    if (loading) return <TableLoading />;
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pedido</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Endereço</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Entregador</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(Array.isArray(deliveries) ? deliveries : []).map((d: any) => (
            <TableRow key={d.id}>
              <TableCell className="font-mono text-sm">#{d.order?.orderNumber || d.orderId?.slice(0, 8)}</TableCell>
              <TableCell>{d.order?.user?.name || '-'}</TableCell>
              <TableCell className="max-w-[200px] truncate text-muted-foreground">
                {d.address || d.order?.deliveryAddress?.street || '-'}
              </TableCell>
              <TableCell>
                <Badge variant={DELIVERY_VARIANTS[d.status] || 'secondary'}>
                  {DELIVERY_STATUS[d.status] || d.status}
                </Badge>
              </TableCell>
              <TableCell>{d.driver?.name || d.driverName || '-'}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(d.createdAt)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  {(!d.driverId || d.status === 'PENDING') && (
                    <Button variant="outline" size="sm" onClick={() => setShowAssign(d.id)}>
                      <User className="h-3 w-3 mr-1" />Atribuir
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => { setShowStatus(d); setNewStatus(d.status); }}>
                    <Clock className="h-3 w-3 mr-1" />Status
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {(!Array.isArray(deliveries) || deliveries.length === 0) && (
            <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma entrega</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Entregas</h1>
        <p className="text-muted-foreground">Gerenciamento de entregas e atribuição de entregadores</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Pendentes', icon: Clock, count: Array.isArray(activeDeliveries) ? activeDeliveries.filter((d: any) => d.status === 'PENDING').length : 0, color: 'text-yellow-600' },
          { label: 'Em Trânsito', icon: Truck, count: Array.isArray(activeDeliveries) ? activeDeliveries.filter((d: any) => d.status === 'IN_TRANSIT').length : 0, color: 'text-blue-600' },
          { label: 'Entregues Hoje', icon: CheckCircle, count: Array.isArray(activeDeliveries) ? activeDeliveries.filter((d: any) => d.status === 'DELIVERED').length : 0, color: 'text-green-600' },
          { label: 'Falhas', icon: MapPin, count: Array.isArray(activeDeliveries) ? activeDeliveries.filter((d: any) => d.status === 'FAILED').length : 0, color: 'text-red-600' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold">{stat.count}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="active">Ativas</TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <Card><CardContent className="pt-6">{renderTable(activeDeliveries, isLoading)}</CardContent></Card>
        </TabsContent>
        <TabsContent value="all">
          <Card><CardContent className="pt-6">{renderTable(allDeliveries, allLoading)}</CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Assign Driver Dialog */}
      <Dialog open={!!showAssign} onOpenChange={() => setShowAssign(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Atribuir Entregador</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ID do Entregador</Label>
              <Input value={driverId} onChange={(e) => setDriverId(e.target.value)} placeholder="ID do entregador" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssign(null)}>Cancelar</Button>
            <Button onClick={() => assignMutation.mutate()} disabled={assignMutation.isPending || !driverId}>Atribuir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={!!showStatus} onOpenChange={() => setShowStatus(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Atualizar Status da Entrega</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Novo Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DELIVERY_STATUS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatus(null)}>Cancelar</Button>
            <Button onClick={() => statusMutation.mutate()} disabled={statusMutation.isPending}>Atualizar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
