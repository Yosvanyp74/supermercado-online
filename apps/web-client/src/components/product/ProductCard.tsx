'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/store/cart-store';
import { useUIStore } from '@/store/ui-store';
import { formatCurrency, getImageUrl } from '@/lib/utils';
import { toast } from 'sonner';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug?: string;
    price: number;
    compareAtPrice?: number;
    mainImageUrl?: string;
    stock?: number;
    unit?: string;
    isOrganic?: boolean;
    isFeatured?: boolean;
    category?: { name: string };
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const setCartDrawer = useUIStore((s) => s.setCartDrawer);

  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      imageUrl: product.mainImageUrl,
      stock: product.stock || 99,
      unit: product.unit,
    });
    toast.success('Produto adicionado ao carrinho!');
    setCartDrawer(true);
  };

  return (
    <Link href={`/products/${product.slug || product.id}`}>
      <Card className="group h-full overflow-hidden hover:shadow-lg transition-shadow duration-200">
        <div className="relative aspect-square bg-muted overflow-hidden">
          <Image
            src={getImageUrl(product.mainImageUrl)}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {discount && (
            <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-500">
              -{discount}%
            </Badge>
          )}
          {product.isOrganic && (
            <Badge variant="success" className="absolute top-2 right-2">
              Orgânico
            </Badge>
          )}
        </div>
        <CardContent className="p-3">
          {product.category && (
            <p className="text-xs text-muted-foreground mb-1">{product.category.name}</p>
          )}
          <h3 className="font-medium text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
            {product.name}
          </h3>
          <div className="flex items-end justify-between">
            <div>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <p className="text-xs text-muted-foreground line-through">
                  {formatCurrency(product.compareAtPrice)}
                </p>
              )}
              <p className="text-lg font-bold text-primary">
                {formatCurrency(product.price)}
              </p>
              {product.unit && (
                <p className="text-xs text-muted-foreground">/{product.unit}</p>
              )}
            </div>
            <Button
              size="icon"
              variant="outline"
              className="h-9 w-9 shrink-0"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
