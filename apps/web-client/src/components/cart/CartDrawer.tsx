'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { X, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/store/cart-store';
import { useUIStore } from '@/store/ui-store';
import { formatCurrency, getImageUrl } from '@/lib/utils';

export function CartDrawer() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();
  const { isCartDrawerOpen, setCartDrawer } = useUIStore();

  if (!isCartDrawerOpen) return null;

  const total = getTotal();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => setCartDrawer(false)}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-background shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Carrinho ({items.length})
          </h2>
          <Button variant="ghost" size="icon" onClick={() => setCartDrawer(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium mb-2">Seu carrinho está vazio</p>
            <p className="text-sm text-muted-foreground mb-4">
              Adicione produtos para começar suas compras
            </p>
            <Button onClick={() => { setCartDrawer(false); router.push('/products'); }}>
              Ver Produtos
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    <div className="relative h-20 w-20 rounded-md overflow-hidden bg-muted shrink-0">
                      <Image
                        src={getImageUrl(item.imageUrl)}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2">{item.name}</p>
                      <p className="text-sm font-bold text-primary mt-1">
                        {formatCurrency(item.price)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => removeItem(item.productId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <p className="text-sm font-semibold">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Subtotal:</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  setCartDrawer(false);
                  router.push('/cart');
                }}
              >
                Ver Carrinho
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setCartDrawer(false);
                  router.push('/checkout');
                }}
              >
                Ir para Checkout
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
