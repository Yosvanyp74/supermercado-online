'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, MapPin, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth-store';
import { usersApi } from '@/lib/api/client';
import { toast } from 'sonner';

export default function AddressesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    label: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const { data: addresses, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await usersApi.getAddresses(user!.id);
      return res.data;
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => usersApi.createAddress(user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      resetForm();
      toast.success('Endereço adicionado!');
    },
    onError: () => toast.error('Erro ao salvar endereço'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof form) => usersApi.updateAddress(user!.id, editingId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      resetForm();
      toast.success('Endereço atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar endereço'),
  });

  const deleteMutation = useMutation({
    mutationFn: (addressId: string) => usersApi.deleteAddress(user!.id, addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Endereço removido');
    },
    onError: () => toast.error('Erro ao remover endereço'),
  });

  const resetForm = () => {
    setForm({ label: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (addr: any) => {
    setForm({
      label: addr.label || '',
      street: addr.street || '',
      number: addr.number || '',
      complement: addr.complement || '',
      neighborhood: addr.neighborhood || '',
      city: addr.city || '',
      state: addr.state || '',
      zipCode: addr.zipCode || '',
    });
    setEditingId(addr.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate(form);
    } else {
      createMutation.mutate(form);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Meus Endereços
          </CardTitle>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {showForm && (
            <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4 mb-6">
              <h4 className="font-medium">{editingId ? 'Editar Endereço' : 'Novo Endereço'}</h4>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Identificação</Label>
                  <Input placeholder="Ex: Casa, Trabalho" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
                </div>
                <div>
                  <Label>CEP</Label>
                  <Input value={form.zipCode} onChange={(e) => setForm((f) => ({ ...f, zipCode: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Rua</Label>
                  <Input value={form.street} onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))} />
                </div>
                <div>
                  <Label>Número</Label>
                  <Input value={form.number} onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))} />
                </div>
                <div>
                  <Label>Complemento</Label>
                  <Input value={form.complement} onChange={(e) => setForm((f) => ({ ...f, complement: e.target.value }))} />
                </div>
                <div>
                  <Label>Bairro</Label>
                  <Input value={form.neighborhood} onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))} />
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" type="button" onClick={resetForm}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          )}

          {addresses && addresses.length > 0 ? (
            <div className="space-y-3">
              {addresses.map((addr: any) => (
                <div key={addr.id} className="p-4 rounded-lg border flex justify-between items-start">
                  <div>
                    <p className="font-medium">{addr.label || 'Endereço'}</p>
                    <p className="text-sm text-muted-foreground">
                      {addr.street}, {addr.number}
                      {addr.complement && ` - ${addr.complement}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {addr.neighborhood}, {addr.city} - {addr.state}, {addr.zipCode}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(addr)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteMutation.mutate(addr.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !showForm && (
              <p className="text-center text-muted-foreground py-8">
                Nenhum endereço cadastrado
              </p>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
