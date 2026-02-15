'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Tag, ArrowLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { categoriesApi } from '@/lib/api/client';
import { getImageUrl } from '@/lib/utils';

export default function CategoryDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: category, isLoading } = useQuery({
    queryKey: ['category', id],
    queryFn: async () => {
      const res = await categoriesApi.findOne(id);
      return res.data;
    },
    enabled: !!id,
  });

  const subcategories = category?.children || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/categories">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar às Categorias
          </Link>
        </Button>

        {isLoading ? (
          <Skeleton className="h-10 w-64" />
        ) : (
          <>
            <h1 className="text-3xl font-bold">{category?.name}</h1>
            {category?.description && (
              <p className="text-muted-foreground mt-1">{category.description}</p>
            )}
          </>
        )}
      </div>

      {/* "Ver todos os produtos" link */}
      {!isLoading && (
        <Link href={`/products?categoryId=${id}`}>
          <Card className="mb-6 hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Tag className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium">Ver todos os produtos desta categoria</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Subcategories grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-lg" />
            ))
          : subcategories.map((sub: any) => {
              const hasChildren = sub.children && sub.children.length > 0;
              const href = hasChildren
                ? `/categories/${sub.id}`
                : `/products?categoryId=${sub.id}`;

              return (
                <Link key={sub.id} href={href}>
                  <Card className="h-44 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer group">
                    <CardContent className="p-4">
                      {sub.imageUrl ? (
                        <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-3">
                          <img
                            src={getImageUrl(sub.imageUrl)}
                            alt={sub.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                          <Tag className="h-8 w-8 text-primary" />
                        </div>
                      )}
                      <p className="text-sm font-medium line-clamp-2">{sub.name}</p>
                      {sub._count?.products != null && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {sub._count.products} produtos
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
      </div>

      {!isLoading && subcategories.length === 0 && (
        <div className="text-center py-16">
          <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">Nenhuma subcategoria</h3>
          <p className="text-muted-foreground">
            <Link href={`/products?categoryId=${id}`} className="text-primary hover:underline">
              Ver produtos desta categoria
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
