'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { SlidersHorizontal, Grid, List, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ProductCard } from '@/components/product/ProductCard';
import { productsApi, categoriesApi } from '@/lib/api/client';

/** Recursively find a category by ID in the category tree */
function findCategoryInTree(categories: any[], id: string): any | null {
  for (const cat of categories) {
    if (cat.id === id) return cat;
    if (cat.children?.length) {
      const found = findCategoryInTree(cat.children, id);
      if (found) return found;
    }
  }
  return null;
}

/** Build breadcrumb path from root to target category */
function buildCategoryPath(categories: any[], id: string, path: any[] = []): any[] | null {
  for (const cat of categories) {
    if (cat.id === id) return [...path, cat];
    if (cat.children?.length) {
      const found = buildCategoryPath(cat.children, id, [...path, cat]);
      if (found) return found;
    }
  }
  return null;
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const page = Number(searchParams.get('page')) || 1;
  const categoryId = searchParams.get('categoryId') || undefined;
  const search = searchParams.get('search') || undefined;
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
  const isFeatured = searchParams.get('isFeatured') === 'true' ? true : undefined;
  const isOrganic = searchParams.get('isOrganic') === 'true' ? true : undefined;
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', { page, categoryId, search, sortBy, sortOrder, isFeatured, isOrganic, minPrice, maxPrice }],
    queryFn: async () => {
      const res = await productsApi.findAll({
        page,
        limit: 12,
        categoryId,
        search,
        sortBy,
        sortOrder,
        isFeatured,
        isOrganic,
        minPrice,
        maxPrice,
        status: 'ACTIVE',
      });
      return res.data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await categoriesApi.findAll();
      return res.data;
    },
  });

  const allCategories = Array.isArray(categories) ? categories : [];

  // Auto-expand parent of currently selected category
  const categoryPath = categoryId ? buildCategoryPath(allCategories, categoryId) : null;
  const selectedCategoryName = categoryPath
    ? categoryPath.map((c: any) => c.name).join(' › ')
    : undefined;

  // Auto-expand parent categories when a subcategory is selected
  const effectiveExpanded = new Set(expandedCategories);
  if (categoryPath && categoryPath.length > 1) {
    categoryPath.slice(0, -1).forEach((c: any) => effectiveExpanded.add(c.id));
  }

  const toggleExpand = (id: string) => {
    const next = new Set(expandedCategories);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedCategories(next);
  };

  const products = Array.isArray(productsData) ? productsData : productsData?.data || [];
  const totalPages = productsData?.meta?.totalPages || 1;

  const updateFilters = (params: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, val]) => {
      if (val === undefined || val === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, val);
      }
    });
    newParams.set('page', '1');
    router.push(`/products?${newParams.toString()}`);
  };

  const clearFilters = () => {
    router.push('/products');
  };

  const hasActiveFilters = categoryId || isFeatured || isOrganic || minPrice || maxPrice;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {isFeatured ? 'Produtos em Destaque' : isOrganic ? 'Produtos Orgânicos' : 'Todos os Produtos'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {products.length} produto(s) encontrado(s)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="md:hidden"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-1" />
            Filtros
          </Button>
          <Select
            value={`${sortBy}-${sortOrder}`}
            onValueChange={(val) => {
              const [sb, so] = val.split('-');
              updateFilters({ sortBy: sb, sortOrder: so });
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt-desc">Mais Recentes</SelectItem>
              <SelectItem value="price-asc">Menor Preço</SelectItem>
              <SelectItem value="price-desc">Maior Preço</SelectItem>
              <SelectItem value="name-asc">Nome A-Z</SelectItem>
              <SelectItem value="name-desc">Nome Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filters sidebar */}
        <aside className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-64 shrink-0`}>
          <div className="space-y-6 p-4 border rounded-lg bg-white">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Filtros</h3>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-3 w-3 mr-1" /> Limpar
                </Button>
              )}
            </div>

            <Separator />

            {/* Categories */}
            <div>
              <h4 className="font-medium mb-3 text-sm">Categorias</h4>
              <div className="space-y-0.5">
                <button
                  className={`block w-full text-left text-sm py-1.5 px-2 rounded hover:bg-gray-100 ${!categoryId ? 'bg-primary/10 text-primary font-medium' : ''}`}
                  onClick={() => updateFilters({ categoryId: undefined })}
                >
                  Todas
                </button>
                {allCategories.map((cat: any) => (
                  <div key={cat.id}>
                    <div className="flex items-center">
                      <button
                        className={`flex-1 text-left text-sm py-1.5 px-2 rounded hover:bg-gray-100 ${categoryId === cat.id ? 'bg-primary/10 text-primary font-medium' : ''}`}
                        onClick={() => updateFilters({ categoryId: cat.id })}
                      >
                        {cat.name}
                      </button>
                      {cat.children?.length > 0 && (
                        <button
                          className="p-1 rounded hover:bg-gray-100"
                          onClick={() => toggleExpand(cat.id)}
                          aria-label={`Expandir ${cat.name}`}
                        >
                          <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${effectiveExpanded.has(cat.id) ? 'rotate-90' : ''}`} />
                        </button>
                      )}
                    </div>
                    {cat.children?.length > 0 && effectiveExpanded.has(cat.id) && (
                      <div className="ml-3 border-l pl-2 space-y-0.5">
                        {cat.children.map((sub: any) => (
                          <button
                            key={sub.id}
                            className={`block w-full text-left text-sm py-1 px-2 rounded hover:bg-gray-100 ${categoryId === sub.id ? 'bg-primary/10 text-primary font-medium' : ''}`}
                            onClick={() => updateFilters({ categoryId: sub.id })}
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Filters */}
            <div>
              <h4 className="font-medium mb-3 text-sm">Tipo</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!isFeatured}
                    onChange={(e) => updateFilters({ isFeatured: e.target.checked ? 'true' : undefined })}
                    className="rounded"
                  />
                  Em Destaque
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!isOrganic}
                    onChange={(e) => updateFilters({ isOrganic: e.target.checked ? 'true' : undefined })}
                    className="rounded"
                  />
                  Orgânicos
                </label>
              </div>
            </div>

            <Separator />

            {/* Price range */}
            <div>
              <h4 className="font-medium mb-3 text-sm">Faixa de Preço</h4>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  className="h-8 text-sm"
                  defaultValue={minPrice}
                  onBlur={(e) => updateFilters({ minPrice: e.target.value || undefined })}
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  className="h-8 text-sm"
                  defaultValue={maxPrice}
                  onBlur={(e) => updateFilters({ maxPrice: e.target.value || undefined })}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          {/* Active filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              {categoryId && selectedCategoryName && (
                <Badge variant="secondary" className="gap-1">
                  {selectedCategoryName}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilters({ categoryId: undefined })} />
                </Badge>
              )}
              {isFeatured && (
                <Badge variant="secondary" className="gap-1">
                  Destaques
                  <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilters({ isFeatured: undefined })} />
                </Badge>
              )}
              {isOrganic && (
                <Badge variant="secondary" className="gap-1">
                  Orgânicos
                  <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilters({ isOrganic: undefined })} />
                </Badge>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-lg" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg font-medium mb-2">Nenhum produto encontrado</p>
              <p className="text-muted-foreground mb-4">Tente ajustar os filtros</p>
              <Button variant="outline" onClick={clearFilters}>Limpar Filtros</Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.set('page', String(page - 1));
                      router.push(`/products?${params.toString()}`);
                    }}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.set('page', String(page + 1));
                      router.push(`/products?${params.toString()}`);
                    }}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
