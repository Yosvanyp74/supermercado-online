'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Calculator } from 'lucide-react';
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
  sku: z.string().optional().default(''),
  barcode: z.string().optional(),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  categoryId: z.string().min(1, 'Categoria obrigatória'),
  costPrice: z.coerce.number().positive('Custo deve ser positivo'),
  productRole: z.enum(['ANCLA', 'CONVENIENCIA', 'IMPULSO', 'PREMIUM'], { required_error: 'Rol estratégico obrigatório' }),
  compareAtPrice: z.coerce.number().optional().or(z.literal('')),
  stock: z.coerce.number().int().min(0).default(0),
  minStock: z.coerce.number().int().min(0).default(0),
  unit: z.string().optional(),
  weight: z.coerce.number().optional().or(z.literal('')),
  mainImageUrl: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED', 'EXPIRED']).default('ACTIVE'),
  isFeatured: z.boolean().default(false),
  isOrganic: z.boolean().default(false),
  expiresAt: z.string().optional().or(z.literal('')),
});

type ProductFormData = z.infer<typeof productSchema>;

// Client-side pricing preview (mirrors backend PricingService v1.1 — safe rounding)
function calcPricePreview(cost: number, role: string): { price: number; margin: number } | null {
  if (!cost || cost <= 0 || !role) return null;
  const bands = [{ max: 3, m: 0.30 }, { max: 15, m: 0.20 }, { max: 60, m: 0.15 }, { max: Infinity, m: 0.10 }];
  const adj: Record<string, number> = { ANCLA: -0.05, CONVENIENCIA: 0, IMPULSO: 0.10, PREMIUM: 0.03 };
  let margin = (bands.find(b => cost < b.max)?.m ?? 0.10) + (adj[role] ?? 0);
  margin = Math.max(0.08, Math.min(0.40, margin));
  const raw = cost * (1 + margin);
  let rounded: number;
  if (raw < 1) {
    rounded = Math.ceil(raw * 10) / 10;
  } else {
    const decimal = raw % 1;
    const intPart = Math.floor(raw);
    rounded = decimal <= 0.49 ? intPart + 0.59 : intPart + 0.99;
  }
  if (rounded <= cost) rounded = Number((Math.ceil(cost * 100) / 100 + 0.05).toFixed(2));
  rounded = Number(rounded.toFixed(2));
  return { price: rounded, margin: Math.round(((rounded - cost) / cost) * 10000) / 10000 };
}

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
      stock: '' as any,
      minStock: '' as any,
      isFeatured: false,
      isOrganic: false,
    },
  });

  // Fetch next SKU
  const { data: nextSkuData } = useQuery({
    queryKey: ['next-sku'],
    queryFn: () => productsApi.getNextSku(),
  });

  useEffect(() => {
    if (nextSkuData?.data?.sku) {
      setValue('sku', nextSkuData.data.sku);
    }
  }, [nextSkuData, setValue]);

  const createMutation = useMutation({
    mutationFn: (data: ProductFormData) => {
      const payload: any = { ...data };
      if (payload.compareAtPrice === '' || payload.compareAtPrice === undefined) delete payload.compareAtPrice;
      if (payload.weight === '' || payload.weight === undefined) delete payload.weight;
      if (payload.expiresAt === '' || payload.expiresAt === undefined) delete payload.expiresAt;
      // price is auto-calculated on backend from costPrice + productRole
      delete payload.price;
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

  const costValue = watch('costPrice');
  const roleValue = watch('productRole');
  const pricingPreview = calcPricePreview(Number(costValue) || 0, roleValue);

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
                  <SelectItem value="EXPIRED">Expirado</SelectItem>
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
            <CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5" />Pricing Automático</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="costPrice">Custo (R$) *</Label>
              <Input id="costPrice" type="number" step="0.01" {...register('costPrice')} />
              {errors.costPrice && <p className="text-sm text-destructive">{errors.costPrice.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="productRole">Rol Estratégico *</Label>
              <Select onValueChange={(v: any) => setValue('productRole', v)} value={watch('productRole')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANCLA">⚓ Ancla (margen -5%)</SelectItem>
                  <SelectItem value="CONVENIENCIA">🛒 Conveniencia (base)</SelectItem>
                  <SelectItem value="IMPULSO">⚡ Impulso (margen +10%)</SelectItem>
                  <SelectItem value="PREMIUM">⭐ Premium (margen +3%)</SelectItem>
                </SelectContent>
              </Select>
              {errors.productRole && <p className="text-sm text-destructive">{errors.productRole.message}</p>}
            </div>
            {pricingPreview && (
              <div className="md:col-span-2 rounded-lg border bg-muted/50 p-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Preço Final (auto)</p>
                  <p className="text-2xl font-bold text-primary">R$ {pricingPreview.price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Margem Aplicada</p>
                  <p className="text-2xl font-bold">{(pricingPreview.margin * 100).toFixed(1)}%</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estoque e Unidades</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="stock">Estoque *</Label>
              <Input id="stock" type="number" placeholder="0" {...register('stock')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">Estoque Mínimo</Label>
              <Input id="minStock" type="number" placeholder="0" {...register('minStock')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unidade</Label>
              <Input id="unit" placeholder="un, kg, l..." {...register('unit')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Peso (g)</Label>
              <Input id="weight" type="number" step="0.01" {...register('weight')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiresAt">Data de Validade</Label>
              <Input id="expiresAt" type="date" {...register('expiresAt')} />
              {watch('expiresAt') && new Date(watch('expiresAt')!) < new Date() && (
                <p className="text-sm text-destructive font-medium">⚠ Este produto já está vencido!</p>
              )}
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
