'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ShoppingCart, Heart, Minus, Plus, Star, ChevronRight, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { ProductCard } from '@/components/product/ProductCard';
import { useCartStore } from '@/store/cart-store';
import { useUIStore } from '@/store/ui-store';
import { productsApi, reviewsApi, wishlistApi } from '@/lib/api/client';
import { formatCurrency, getImageUrl } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const setCartDrawer = useUIStore((s) => s.setCartDrawer);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const res = await productsApi.findBySlug(slug);
      return res.data;
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', product?.id],
    queryFn: async () => {
      if (!product?.id) return null;
      const res = await reviewsApi.findByProduct(product.id, { limit: 5 });
      return res.data;
    },
    enabled: !!product?.id,
  });

  const { data: reviewSummary } = useQuery({
    queryKey: ['review-summary', product?.id],
    queryFn: async () => {
      if (!product?.id) return null;
      const res = await reviewsApi.getReviewSummary(product.id);
      return res.data;
    },
    enabled: !!product?.id,
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ['products', 'related', product?.categoryId],
    queryFn: async () => {
      if (!product?.categoryId) return [];
      const res = await productsApi.findAll({ categoryId: product.categoryId, limit: 4, status: 'ACTIVE' });
      return res.data;
    },
    enabled: !!product?.categoryId,
  });

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      imageUrl: product.mainImageUrl,
      stock: product.stock || 99,
      unit: product.unit,
      quantity,
    });
    toast.success('Produto adicionado ao carrinho!');
    setCartDrawer(true);
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Faça login para adicionar à lista de desejos');
      return;
    }
    try {
      await wishlistApi.toggleItem(product.id);
      toast.success('Lista de desejos atualizada!');
    } catch {
      toast.error('Erro ao atualizar lista de desejos');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-lg mb-4">Produto não encontrado</p>
        <Button asChild>
          <Link href="/products">Ver Produtos</Link>
        </Button>
      </div>
    );
  }

  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : null;

  const related = Array.isArray(relatedProducts) ? relatedProducts : relatedProducts?.data || [];
  const reviewsList = Array.isArray(reviews) ? reviews : reviews?.data || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">Início</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/products" className="hover:text-foreground">Produtos</Link>
        {product.category && (
          <>
            <ChevronRight className="h-3 w-3" />
            <Link href={`/products?categoryId=${product.category.id}`} className="hover:text-foreground">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Product Image */}
        <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
          <Image
            src={getImageUrl(product.mainImageUrl)}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
          {discount && (
            <Badge className="absolute top-4 left-4 bg-red-500 hover:bg-red-500 text-lg px-3 py-1">
              -{discount}%
            </Badge>
          )}
          {product.isOrganic && (
            <Badge variant="success" className="absolute top-4 right-4">
              Orgânico
            </Badge>
          )}
        </div>

        {/* Product Info */}
        <div>
          {product.category && (
            <p className="text-sm text-muted-foreground mb-2">{product.category.name}</p>
          )}
          <h1 className="text-2xl md:text-3xl font-bold mb-3">{product.name}</h1>

          {/* Rating */}
          {reviewSummary && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.round(reviewSummary.averageRating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                ({reviewSummary.totalReviews || 0} avaliações)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="mb-6">
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <p className="text-lg text-muted-foreground line-through">
                {formatCurrency(product.compareAtPrice)}
              </p>
            )}
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(product.price)}
            </p>
            {product.unit && (
              <p className="text-sm text-muted-foreground">por {product.unit}</p>
            )}
          </div>

          {/* Short description */}
          {product.shortDescription && (
            <p className="text-muted-foreground mb-6">{product.shortDescription}</p>
          )}

          {/* Stock status */}
          <div className="mb-6">
            {product.stock > 0 ? (
              <Badge variant="success">Em estoque ({product.stock} disponíveis)</Badge>
            ) : (
              <Badge variant="destructive">Fora de estoque</Badge>
            )}
          </div>

          {/* Quantity + Add to cart */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex items-center border rounded-md">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                disabled={quantity >= (product.stock || 99)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button
              size="lg"
              className="flex-1"
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Adicionar ao Carrinho
            </Button>
            <Button variant="outline" size="lg" onClick={handleToggleWishlist}>
              <Heart className="h-5 w-5" />
            </Button>
          </div>

          {/* Delivery info */}
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Truck className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="font-medium text-sm">Entrega Rápida</p>
                <p className="text-xs text-muted-foreground">
                  Frete grátis para compras acima de R$ 150,00
                </p>
              </div>
            </CardContent>
          </Card>

          {/* SKU */}
          {product.sku && (
            <p className="text-xs text-muted-foreground mt-4">SKU: {product.sku}</p>
          )}
          {product.expiresAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Validade: {new Date(product.expiresAt).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
      </div>

      {/* Tabs: Description & Reviews */}
      <Tabs defaultValue="description" className="mb-12">
        <TabsList>
          <TabsTrigger value="description">Descrição</TabsTrigger>
          <TabsTrigger value="reviews">
            Avaliações ({reviewSummary?.totalReviews || 0})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="description" className="mt-4">
          <div className="prose max-w-none">
            <p className="text-muted-foreground whitespace-pre-line">
              {product.description || 'Sem descrição disponível.'}
            </p>
          </div>
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {product.tags.map((tag: string) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="reviews" className="mt-4">
          {reviewsList.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              Nenhuma avaliação ainda. Seja o primeiro a avaliar!
            </p>
          ) : (
            <div className="space-y-4">
              {reviewsList.map((review: any) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">{review.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {review.user?.firstName} {review.user?.lastName}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Related products */}
      {related.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Produtos Relacionados</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {related
              .filter((p: any) => p.id !== product.id)
              .slice(0, 4)
              .map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
