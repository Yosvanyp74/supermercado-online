'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Tag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { categoriesApi } from '@/lib/api/client';
import { getImageUrl } from '@/lib/utils';

export default function CategoriesPage() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await categoriesApi.findAll();
      return res.data;
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Todas as Categorias</h1>
        <p className="text-muted-foreground mt-1">
          Navegue por todas as categorias disponíveis
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {isLoading
          ? Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))
          : (Array.isArray(categories) ? categories : []).map((cat: any) => {
              const href = cat.children?.length > 0
                ? `/categories/${cat.id}`
                : `/products?categoryId=${cat.id}`;
              return (
              <Link key={cat.id} href={href}>
                <Card className="h-44 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="p-4">
                    {cat.imageUrl ? (
                      <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-3">
                        <img
                          src={getImageUrl(cat.imageUrl)}
                          alt={cat.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                        <Tag className="h-8 w-8 text-primary" />
                      </div>
                    )}
                    <p className="text-sm font-medium line-clamp-2">{cat.name}</p>
                    {cat._count?.products != null && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {cat._count.products} produtos
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
              );
            })}
      </div>

      {!isLoading && (!categories || (Array.isArray(categories) && categories.length === 0)) && (
        <div className="text-center py-16">
          <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">Nenhuma categoria encontrada</h3>
          <p className="text-muted-foreground">
            As categorias aparecerão aqui quando forem adicionadas.
          </p>
        </div>
      )}
    </div>
  );
}
