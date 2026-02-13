'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import { productsApi, categoriesApi } from '@/lib/api/client';
import Link from 'next/link';

const productSchema = z.object({
  sku: z.string().min(1, 'SKU obrigatório'),
  barcode: z.string().optional(),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  categoryId: z.string().min(1, 'Categoria obrigatória'),
  price: z.coerce.number().positive('Preço deve ser positivo'),
  costPrice: z.coerce.number().positive().optional().or(z.literal('')),
  compareAtPrice: z.coerce.number().optional().or(z.literal('')),
  stock: z.coerce.number().int().min(0).default(0),
  minStock: z.coerce.number().int().min(0).default(0),
  unit: z.string().optional(),
  weight: z.coerce.number().optional().or(z.literal('')),
  mainImageUrl: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED']).default('ACTIVE'),
  isFeatured: z.boolean().default(false),
  isOrganic: z.boolean().default(false),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function NewProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.findAll(),
  });

  const categories = categoriesData?.data?.data || categoriesData?.data || [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      status: 'ACTIVE',
      stock: 0,
      minStock: 0,
      isFeatured: false,
      isOrganic: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ProductFormData) => {
      const payload: any = { ...data };
      if (payload.costPrice === '' || payload.costPrice === undefined) delete payload.costPrice;
      if (payload.compareAtPrice === '' || payload.compareAtPrice === undefined) delete payload.compareAtPrice;
      if (payload.weight === '' || payload.weight === undefined) delete payload.weight;
      return productsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto criado com sucesso');
      router.push('/products');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao criar produto');
    },
  });

  const flatCategories = flattenCategories(Array.isArray(categories) ? categories : []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo Produto</h1>
          <p className="text-muted-foreground">Cadastre um novo produto no catálogo</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input id="sku" {...register('sku')} />
              {errors.sku && <p className="text-sm text-destructive">{errors.sku.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">Código de Barras</Label>
              <Input id="barcode" {...register('barcode')} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">Categoria *</Label>
              <Select onValueChange={(v) => setValue('categoryId', v)} value={watch('categoryId')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  {flatCategories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.prefix}{cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-sm text-destructive">{errors.categoryId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                onValueChange={(v: any) => setValue('status', v)}
                value={watch('status')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Ativo</SelectItem>
                  <SelectItem value="INACTIVE">Inativo</SelectItem>
                  <SelectItem value="OUT_OF_STOCK">Sem Estoque</SelectItem>
                  <SelectItem value="DISCONTINUED">Descontinuado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" {...register('description')} rows={4} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preços e Estoque</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$) *</Label>
              <Input id="price" type="number" step="0.01" {...register('price')} />
              {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">Preço de Custo (R$)</Label>
              <Input id="costPrice" type="number" step="0.01" {...register('costPrice')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="compareAtPrice">Preço Comparativo (R$)</Label>
              <Input id="compareAtPrice" type="number" step="0.01" {...register('compareAtPrice')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Estoque *</Label>
              <Input id="stock" type="number" {...register('stock')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">Estoque Mínimo</Label>
              <Input id="minStock" type="number" {...register('minStock')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unidade</Label>
              <Input id="unit" placeholder="un, kg, l..." {...register('unit')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Peso (g)</Label>
              <Input id="weight" type="number" step="0.01" {...register('weight')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Imagem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Imagem Principal</Label>
              <ImageUpload
                value={watch('mainImageUrl')}
                onChange={(url) => setValue('mainImageUrl', url)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/products">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Criando...' : 'Criar Produto'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function flattenCategories(categories: any[], prefix = '', result: any[] = []): any[] {
  for (const cat of categories) {
    result.push({ ...cat, prefix });
    if (cat.children?.length) {
      flattenCategories(cat.children, prefix + '— ', result);
    }
  }
  return result;
}
