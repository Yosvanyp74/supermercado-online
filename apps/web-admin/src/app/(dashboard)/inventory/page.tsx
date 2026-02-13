'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, AlertTriangle, ArrowDownUp, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { TableLoading } from '@/components/ui/loading';
import { inventoryApi } from '@/lib/api/client';
import { formatDate } from '@/lib/utils';

const MOVEMENT_TYPES: Record<string, string> = {
  IN: 'Entrada', OUT: 'Saída', ADJUSTMENT: 'Ajuste',
  RETURN: 'Devolução', DAMAGE: 'Avaria', TRANSFER: 'Transferência',
};

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('inventory');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [movementData, setMovementData] = useState({ productId: '', type: 'IN', quantity: 0, reason: '' });
  const [adjustData, setAdjustData] = useState({ productId: '', quantity: 0, reason: '' });

  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ['inventory', page, search, lowStockOnly],
    queryFn: () => inventoryApi.getInventory({ page, limit: 10, search: search || undefined, lowStock: lowStockOnly || undefined }),
  });

  const { data: movementsData, isLoading: movementsLoading } = useQuery({
    queryKey: ['inventory-movements', page],
    queryFn: () => inventoryApi.getMovements({ page, limit: 10 }),
    enabled: tab === 'movements',
  });

  const { data: lowStockData } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => inventoryApi.getLowStock(),
    enabled: tab === 'alerts',
  });

  const createMovement = useMutation({
    mutationFn: () => inventoryApi.createMovement(movementData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      toast.success('Movimentação registrada');
      setShowMovementForm(false);
      setMovementData({ productId: '', type: 'IN', quantity: 0, reason: '' });
    },
    onError: () => toast.error('Erro ao registrar movimentação'),
  });

  const adjustStock = useMutation({
    mutationFn: () => inventoryApi.adjustStock(adjustData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Estoque ajustado');
      setShowAdjustForm(false);
      setAdjustData({ productId: '', quantity: 0, reason: '' });
    },
    onError: () => toast.error('Erro ao ajustar estoque'),
  });

  const inventory = inventoryData?.data?.data || inventoryData?.data || [];
  const movements = movementsData?.data?.data || movementsData?.data || [];
  const lowStockItems = lowStockData?.data?.data || lowStockData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventário</h1>
          <p className="text-muted-foreground">Controle de estoque e movimentações</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAdjustForm(true)}>
            <ArrowDownUp className="mr-2 h-4 w-4" />Ajustar
          </Button>
          <Button onClick={() => setShowMovementForm(true)}>
            <Plus className="mr-2 h-4 w-4" />Movimentação
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="inventory">Estoque</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
          <TabsTrigger value="alerts">
            Alertas
            {Array.isArray(lowStockItems) && lowStockItems.length > 0 && (
              <Badge variant="destructive" className="ml-2">{lowStockItems.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar produto..." className="pl-9" value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? <TableLoading /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Estoque</TableHead>
                      <TableHead>Mínimo</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(inventory) ? inventory : []).map((item: any) => {
                      const stock = item.stock ?? item.currentStock ?? 0;
                      const minStock = item.minStock ?? 0;
                      return (
                        <TableRow key={item.id || item.productId}>
                          <TableCell className="font-medium">{item.name || item.product?.name}</TableCell>
                          <TableCell className="font-mono text-sm">{item.sku || item.product?.sku}</TableCell>
                          <TableCell>
                            <Badge variant={stock <= minStock ? 'destructive' : 'secondary'}>{stock}</Badge>
                          </TableCell>
                          <TableCell>{minStock}</TableCell>
                          <TableCell>
                            <Badge variant={stock === 0 ? 'destructive' : stock <= minStock ? 'warning' : 'success'}>
                              {stock === 0 ? 'Esgotado' : stock <= minStock ? 'Baixo' : 'Normal'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(!Array.isArray(inventory) || inventory.length === 0) && (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum item</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card>
            <CardContent className="pt-6">
              {movementsLoading ? <TableLoading /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(movements) ? movements : []).map((mov: any) => (
                      <TableRow key={mov.id}>
                        <TableCell className="text-muted-foreground">{formatDate(mov.createdAt)}</TableCell>
                        <TableCell className="font-medium">{mov.product?.name || '-'}</TableCell>
                        <TableCell><Badge variant="outline">{MOVEMENT_TYPES[mov.type] || mov.type}</Badge></TableCell>
                        <TableCell className={mov.type === 'OUT' || mov.quantity < 0 ? 'text-red-600' : 'text-green-600'}>
                          {mov.type === 'OUT' ? '-' : '+'}{Math.abs(mov.quantity)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{mov.reason || '-'}</TableCell>
                      </TableRow>
                    ))}
                    {(!Array.isArray(movements) || movements.length === 0) && (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma movimentação</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Produtos com Estoque Baixo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Estoque Atual</TableHead>
                    <TableHead>Estoque Mínimo</TableHead>
                    <TableHead>Diferença</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(lowStockItems) ? lowStockItems : []).map((item: any) => {
                    const stock = item.stock ?? item.currentStock ?? 0;
                    return (
                      <TableRow key={item.id || item.productId}>
                        <TableCell className="font-medium">{item.name || item.product?.name}</TableCell>
                        <TableCell><Badge variant="destructive">{stock}</Badge></TableCell>
                        <TableCell>{item.minStock}</TableCell>
                        <TableCell className="text-red-600">-{item.minStock - stock}</TableCell>
                      </TableRow>
                    );
                  })}
                  {(!Array.isArray(lowStockItems) || lowStockItems.length === 0) && (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Sem alertas</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Movement Dialog */}
      <Dialog open={showMovementForm} onOpenChange={() => setShowMovementForm(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Movimentação de Estoque</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ID do Produto *</Label>
              <Input value={movementData.productId} onChange={(e) => setMovementData({ ...movementData, productId: e.target.value })} placeholder="ID do produto" />
            </div>
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={movementData.type} onValueChange={(v) => setMovementData({ ...movementData, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(MOVEMENT_TYPES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantidade *</Label>
              <Input type="number" value={movementData.quantity} onChange={(e) => setMovementData({ ...movementData, quantity: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Textarea value={movementData.reason} onChange={(e) => setMovementData({ ...movementData, reason: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMovementForm(false)}>Cancelar</Button>
            <Button onClick={() => createMovement.mutate()} disabled={createMovement.isPending}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Dialog */}
      <Dialog open={showAdjustForm} onOpenChange={() => setShowAdjustForm(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajustar Estoque</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ID do Produto *</Label>
              <Input value={adjustData.productId} onChange={(e) => setAdjustData({ ...adjustData, productId: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Quantidade (negativo para reduzir) *</Label>
              <Input type="number" value={adjustData.quantity} onChange={(e) => setAdjustData({ ...adjustData, quantity: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Motivo *</Label>
              <Textarea value={adjustData.reason} onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdjustForm(false)}>Cancelar</Button>
            <Button onClick={() => adjustStock.mutate()} disabled={adjustStock.isPending}>Ajustar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
