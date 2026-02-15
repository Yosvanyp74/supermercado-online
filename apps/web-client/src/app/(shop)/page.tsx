'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Truck, Shield, Clock, Leaf, Star, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/components/product/ProductCard';
import { productsApi, categoriesApi } from '@/lib/api/client';
import { getImageUrl } from '@/lib/utils';

export default function HomePage() {
  const { data: featuredProducts, isLoading: loadingFeatured } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const res = await productsApi.findFeatured(8);
      return res.data;
    },
  });

  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await categoriesApi.findAll();
      return res.data;
    },
  });

  const { data: recentProducts, isLoading: loadingRecent } = useQuery({
    queryKey: ['products', 'recent'],
    queryFn: async () => {
      const res = await productsApi.findAll({ limit: 8, sortBy: 'createdAt', sortOrder: 'desc' });
      return res.data;
    },
  });

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-green-800 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Produtos frescos na sua porta
            </h1>
            <p className="text-lg md:text-xl mb-8 text-green-100">
              Compre no conforto de casa e receba tudo com rapidez e qualidade.
              Frete grátis para compras acima de R$ 150,00.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/products">
                  Comprar Agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10" asChild>
                <Link href="/products?isFeatured=true">Ver Destaques</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 py-2">
              <Truck className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="font-medium text-sm">Entrega Rápida</p>
                <p className="text-xs text-muted-foreground">Em toda Venâncio Aires</p>
              </div>
            </div>
            <div className="flex items-center gap-3 py-2">
              <Shield className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="font-medium text-sm">Pagamento Seguro</p>
                <p className="text-xs text-muted-foreground">Dados protegidos</p>
              </div>
            </div>
            <div className="flex items-center gap-3 py-2">
              <Clock className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="font-medium text-sm">Horário Flexível</p>
                <p className="text-xs text-muted-foreground">Escolha a melhor hora</p>
              </div>
            </div>
            <div className="flex items-center gap-3 py-2">
              <Leaf className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="font-medium text-sm">Produtos Frescos</p>
                <p className="text-xs text-muted-foreground">Qualidade garantida</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Categorias</h2>
            <Button variant="ghost" asChild>
              <Link href="/categories">
                Ver Todas <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {loadingCategories
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-lg" />
                ))
              : (Array.isArray(categories) ? categories : []).slice(0, 6).map((cat: any) => {
                  const href = cat.children?.length > 0
                    ? `/categories/${cat.id}`
                    : `/products?categoryId=${cat.id}`;
                  return (
                  <Link key={cat.id} href={href}>
                    <Card className="h-40 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer group">
                      <CardContent className="p-4">
                        {cat.imageUrl ? (
                          <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-2">
                            <img
                              src={getImageUrl(cat.imageUrl)}
                              alt={cat.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/20 transition-colors">
                            <Tag className="h-8 w-8 text-primary" />
                          </div>
                        )}
                        <p className="text-sm font-medium line-clamp-2">{cat.name}</p>
                      </CardContent>
                    </Card>
                  </Link>
                  );
                })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Produtos em Destaque</h2>
              <p className="text-muted-foreground">Os mais populares da semana</p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/products?isFeatured=true">
                Ver Todos <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {loadingFeatured
              ? Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-72 rounded-lg" />
                ))
              : (Array.isArray(featuredProducts) ? featuredProducts : featuredProducts?.data || []).slice(0, 8).map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
          </div>
        </div>
      </section>

      {/* Recent Products */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Novidades</h2>
              <p className="text-muted-foreground">Chegaram agora no SuperMercado</p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/products?sortBy=createdAt&sortOrder=desc">
                Ver Todos <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {loadingRecent
              ? Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-72 rounded-lg" />
                ))
              : (Array.isArray(recentProducts) ? recentProducts : recentProducts?.data || []).slice(0, 8).map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4 text-center">
          <Star className="h-10 w-10 mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Programa de Fidelidade
          </h2>
          <p className="text-lg mb-6 max-w-xl mx-auto opacity-90">
            Ganhe pontos a cada compra e troque por descontos e produtos exclusivos!
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/register">Criar Conta Grátis</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
