'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Heart, Trash2, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { wishlistApi } from '@/lib/api/client';
import { useCartStore } from '@/store/cart-store';
import { formatCurrency, getImageUrl } from '@/lib/utils';
import { toast } from 'sonner';

export default function WishlistPage() {
  const queryClient = useQueryClient();
  const addItem = useCartStore((s) => s.addItem);

  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const res = await wishlistApi.getWishlist();
      return res.data;
    },
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => wishlistApi.removeItem(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Removido da lista de desejos');
    },
  });

  const items = Array.isArray(data) ? data : data?.items || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Lista de Desejos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">Sua lista de desejos está vazia</p>
            <Button asChild>
              <Link href="/products">Explorar Produtos</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item: any) => {
              const product = item.product || item;
              return (
                <div key={product.id} className="flex items-center gap-4 p-4 rounded-lg border">
                  <div className="relative h-16 w-16 rounded bg-muted overflow-hidden shrink-0">
                    <Image
                      src={getImageUrl(product.images?.[0]?.url || product.imageUrl)}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${product.slug || product.id}`}
                      className="font-medium hover:text-primary line-clamp-1"
                    >
                      {product.name}
                    </Link>
                    <p className="text-primary font-bold">{formatCurrency(product.price)}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => {
                        addItem({
                          id: product.id,
                          productId: product.id,
                          name: product.name,
                          price: product.price,
                          imageUrl: product.images?.[0]?.url || product.imageUrl,
                          stock: product.stock || 99,
                          quantity: 1,
                        });
                        toast.success('Adicionado ao carrinho');
                      }}
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive"
                      onClick={() => removeMutation.mutate(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
