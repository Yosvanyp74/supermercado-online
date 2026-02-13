'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Minus, Plus, X, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/store/cart-store';
import { formatCurrency, getImageUrl } from '@/lib/utils';
import { useState } from 'react';
import { couponsApi } from '@/lib/api/client';
import { toast } from 'sonner';

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState('');

  const subtotal = getTotal();
  const shipping = subtotal >= 150 ? 0 : 9.90;
  const total = subtotal - couponDiscount + shipping;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await couponsApi.validate({ code: couponCode, orderTotal: subtotal });
      setCouponDiscount(res.data.discount || 0);
      setAppliedCoupon(couponCode);
      toast.success('Cupom aplicado com sucesso!');
    } catch {
      toast.error('Cupom inválido ou expirado');
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Seu carrinho está vazio</h1>
        <p className="text-muted-foreground mb-6">
          Adicione produtos para começar suas compras
        </p>
        <Button asChild>
          <Link href="/products">Explorar Produtos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Carrinho de Compras</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">{items.length} item(ns)</p>
            <Button variant="ghost" size="sm" className="text-destructive" onClick={clearCart}>
              <Trash2 className="h-4 w-4 mr-1" /> Limpar Carrinho
            </Button>
          </div>

          {items.map((item) => (
            <Card key={item.productId}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="relative h-24 w-24 rounded-md overflow-hidden bg-gray-100 shrink-0">
                    <Image
                      src={getImageUrl(item.imageUrl)}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.productId}`}
                      className="font-medium hover:text-primary line-clamp-2"
                    >
                      {item.name}
                    </Link>
                    <p className="text-primary font-bold mt-1">
                      {formatCurrency(item.price)}
                      {item.unit && <span className="text-xs text-muted-foreground font-normal"> /{item.unit}</span>}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeItem(item.productId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Coupon */}
              <div className="flex gap-2">
                <Input
                  placeholder="Código do cupom"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={!!appliedCoupon}
                />
                <Button
                  variant="outline"
                  onClick={handleApplyCoupon}
                  disabled={!!appliedCoupon}
                >
                  Aplicar
                </Button>
              </div>
              {appliedCoupon && (
                <p className="text-sm text-green-600">Cupom &ldquo;{appliedCoupon}&rdquo; aplicado!</p>
              )}

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto</span>
                    <span>-{formatCurrency(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Frete</span>
                  <span>{shipping === 0 ? <span className="text-green-600">Grátis</span> : formatCurrency(shipping)}</span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Frete grátis para compras acima de R$ 150,00
                  </p>
                )}
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() => router.push('/checkout')}
              >
                Finalizar Compra
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button variant="ghost" className="w-full" asChild>
                <Link href="/products">Continuar Comprando</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
