'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth-store';
import { usersApi, uploadsApi } from '@/lib/api/client';
import { getImageUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { Loader2, Camera } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await usersApi.getMe();
      return res.data;
    },
  });

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [initialized, setInitialized] = useState(false);

  if (profile && !initialized) {
    setForm({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      phone: profile.phone || '',
    });
    setInitialized(true);
  }

  const updateMutation = useMutation({
    mutationFn: (data: typeof form) => usersApi.updateMe(data),
    onSuccess: (res) => {
      updateUser({
        firstName: res.data.firstName,
        lastName: res.data.lastName,
        phone: res.data.phone,
      });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: () => toast.error('Erro ao atualizar perfil'),
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const { data: uploadData } = await uploadsApi.uploadImage(file, 'avatars');
      const { data: updatedUser } = await usersApi.updateMe({ avatarUrl: uploadData.url });
      updateUser({ avatarUrl: updatedUser.avatarUrl });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Foto atualizada com sucesso!');
    } catch {
      toast.error('Erro ao enviar foto');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const avatarUrl = profile?.avatarUrl || user?.avatarUrl;
  const initials = `${(profile?.firstName || user?.firstName || 'U').charAt(0)}${(profile?.lastName || user?.lastName || '').charAt(0)}`.toUpperCase();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Avatar Card */}
      <Card>
        <CardHeader>
          <CardTitle>Foto de Perfil</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="relative group">
            {avatarUrl ? (
              <img
                src={getImageUrl(avatarUrl)}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">{initials}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-wait"
            >
              {uploadingAvatar ? (
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
            aria-label="Upload foto de perfil"
          />
          <p className="text-sm text-muted-foreground">
            Clique na foto para alterar. JPG, PNG ou WebP até 2MB.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate(form);
            }}
            className="space-y-4"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              </div>
              <div>
                <Label>Sobrenome</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input value={profile?.email || ''} disabled />
              <p className="text-xs text-muted-foreground mt-1">O email não pode ser alterado</p>
            </div>
            <div>
              <Label>Telefone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="(51) 99999-9999"
              />
            </div>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Segurança</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Para alterar sua senha, utilize a opção &ldquo;Esqueci minha senha&rdquo; na tela de login.
          </p>
          <div>
            <Label>Membro desde</Label>
            <p className="text-sm mt-1">
              {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('pt-BR') : '-'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
