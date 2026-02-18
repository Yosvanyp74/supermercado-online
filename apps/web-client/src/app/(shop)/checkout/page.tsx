'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  CreditCard,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Plus,
  Truck,
  Store,
  Banknote,
  QrCode,
  Loader2,
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCartStore } from '@/store/cart-store';
import { useAuthStore } from '@/store/auth-store';
import { usersApi, ordersApi } from '@/lib/api/client';
import { formatCurrency, getImageUrl } from '@/lib/utils';
import { toast } from 'sonner';

type Step = 'shipping' | 'payment' | 'confirmation';
type FulfillmentType = 'DELIVERY' | 'PICKUP';
type PaymentMethod = 'CREDIT_CARD' | 'PIX' | 'CASH';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { items, getTotal, clearCart } = useCartStore();
  const [step, setStep] = useState<Step>('shipping');
  const [fulfillment, setFulfillment] = useState<FulfillmentType>('DELIVERY');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [notes, setNotes] = useState('');
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
    }
  }, [isAuthenticated, router]);

  const subtotal = getTotal();
  const shipping = fulfillment === 'PICKUP' ? 0 : subtotal >= 150 ? 0 : 9.90;
  const total = subtotal + shipping;

  const { data: addresses, isLoading: loadingAddresses, refetch: refetchAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await usersApi.getAddresses(user!.id);
      return res.data;
    },
    enabled: !!user,
  });

  const createAddressMutation = useMutation({
    mutationFn: (data: typeof newAddress) => usersApi.createAddress(user!.id, data),
    onSuccess: (res) => {
      refetchAddresses();
      setSelectedAddressId(res.data.id);
      setShowNewAddress(false);
      setNewAddress({ label: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '' });
      toast.success('Endereço adicionado!');
    },
    onError: () => toast.error('Erro ao salvar endereço'),
  });

  const createOrderMutation = useMutation({
    mutationFn: () =>
      ordersApi.create({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        fulfillmentType: fulfillment,
        deliveryAddressId: fulfillment === 'DELIVERY' ? selectedAddressId : undefined,
        notes: notes || undefined,
      }),
    onSuccess: (res) => {
      clearCart();
      router.push(`/account/orders/${res.data.id}?success=true`);
      toast.success('Pedido realizado com sucesso!');
    },
    onError: () => toast.error('Erro ao criar o pedido. Tente novamente.'),
  });

  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      setSelectedAddressId(addresses[0].id);
    }
  }, [addresses, selectedAddressId]);

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Carrinho vazio</h1>
        <p className="text-muted-foreground mb-6">Adicione produtos antes de finalizar a compra</p>
        <Button asChild><Link href="/products">Ver Produtos</Link></Button>
      </div>
    );
  }

  const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
    { key: 'shipping', label: 'Entrega', icon: <MapPin className="h-5 w-5" /> },
    { key: 'payment', label: 'Pagamento', icon: <CreditCard className="h-5 w-5" /> },
    { key: 'confirmation', label: 'Confirmação', icon: <CheckCircle className="h-5 w-5" /> },
  ];

  const stepIndex = steps.findIndex((s) => s.key === step);

  const canProceedShipping = fulfillment === 'PICKUP' || !!selectedAddressId;
  const canProceedPayment = !!paymentMethod;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Steps Bar */}
      <div className="flex items-center justify-center mb-8">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                i <= stepIndex
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {s.icon}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-12 h-0.5 mx-2 ${i < stepIndex ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* STEP: SHIPPING */}
          {step === 'shipping' && (
            <>
              {/* Fulfillment Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Tipo de Entrega</CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setFulfillment('DELIVERY')}
                    className={`p-4 rounded-lg border-2 text-left transition ${
                      fulfillment === 'DELIVERY'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Truck className="h-6 w-6 mb-2 text-primary" />
                    <p className="font-medium">Entrega em Casa</p>
                    <p className="text-sm text-muted-foreground">
                      {subtotal >= 150 ? 'Frete grátis' : 'Frete R$ 9,90'}
                    </p>
                  </button>
                  <button
                    onClick={() => setFulfillment('PICKUP')}
                    className={`p-4 rounded-lg border-2 text-left transition ${
                      fulfillment === 'PICKUP'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Store className="h-6 w-6 mb-2 text-primary" />
                    <p className="font-medium">Retirar na Loja</p>
                    <p className="text-sm text-muted-foreground">Sem custo de frete</p>
                  </button>
                </CardContent>
              </Card>

              {/* Address Selection */}
              {fulfillment === 'DELIVERY' && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Endereço de Entrega</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setShowNewAddress(true)}>
                      <Plus className="h-4 w-4 mr-1" /> Novo
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {loadingAddresses ? (
                      <p className="text-muted-foreground py-4 text-center">Carregando...</p>
                    ) : addresses && addresses.length > 0 ? (
                      addresses.map((addr: any) => (
                        <button
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`w-full p-4 rounded-lg border-2 text-left transition ${
                            selectedAddressId === addr.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <p className="font-medium">{addr.label || 'Endereço'}</p>
                          <p className="text-sm text-muted-foreground">
                            {addr.street}, {addr.number}
                            {addr.complement && ` - ${addr.complement}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {addr.neighborhood}, {addr.city} - {addr.state}, {addr.zipCode}
                          </p>
                        </button>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        Nenhum endereço cadastrado. Adicione um novo endereço.
                      </p>
                    )}

                    {/* New Address Form */}
                    {showNewAddress && (
                      <div className="border rounded-lg p-4 space-y-4 mt-4">
                        <h4 className="font-medium">Novo Endereço</h4>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <Label>Identificação (ex: Casa, Trabalho)</Label>
                            <Input
                              value={newAddress.label}
                              onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>CEP</Label>
                            <Input
                              value={newAddress.zipCode}
                              onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <Label>Rua</Label>
                            <Input
                              value={newAddress.street}
                              onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Número</Label>
                            <Input
                              value={newAddress.number}
                              onChange={(e) => setNewAddress({ ...newAddress, number: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Complemento</Label>
                            <Input
                              value={newAddress.complement}
                              onChange={(e) => setNewAddress({ ...newAddress, complement: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Bairro</Label>
                            <Input
                              value={newAddress.neighborhood}
                              onChange={(e) => setNewAddress({ ...newAddress, neighborhood: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Cidade</Label>
                            <Input
                              value={newAddress.city}
                              onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Estado</Label>
                            <Input
                              value={newAddress.state}
                              onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" onClick={() => setShowNewAddress(false)}>Cancelar</Button>
                          <Button onClick={() => createAddressMutation.mutate(newAddress)} disabled={createAddressMutation.isPending}>
                            {createAddressMutation.isPending ? 'Salvando...' : 'Salvar'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Alguma observação para o pedido? (opcional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="ghost" asChild>
                  <Link href="/cart"><ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao Carrinho</Link>
                </Button>
                <Button onClick={() => setStep('payment')} disabled={!canProceedShipping}>
                  Continuar <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </>
          )}

          {/* STEP: PAYMENT */}
          {step === 'payment' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Forma de Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <button
                    onClick={() => setPaymentMethod('PIX')}
                    className={`w-full p-4 rounded-lg border-2 text-left transition flex items-center gap-4 ${
                      paymentMethod === 'PIX'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <QrCode className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">PIX</p>
                      <p className="text-sm text-muted-foreground">Pagamento instantâneo com desconto</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('CREDIT_CARD')}
                    className={`w-full p-4 rounded-lg border-2 text-left transition flex items-center gap-4 ${
                      paymentMethod === 'CREDIT_CARD'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <CreditCard className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">Cartão de Crédito</p>
                      <p className="text-sm text-muted-foreground">Parcele em até 3x sem juros</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('CASH')}
                    className={`w-full p-4 rounded-lg border-2 text-left transition flex items-center gap-4 ${
                      paymentMethod === 'CASH'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Banknote className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">Dinheiro</p>
                      <p className="text-sm text-muted-foreground">Pague na entrega ou retirada</p>
                    </div>
                  </button>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep('shipping')}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
                </Button>
                <Button onClick={() => setStep('confirmation')} disabled={!canProceedPayment}>
                  Revisar Pedido <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </>
          )}

          {/* STEP: CONFIRMATION */}
          {step === 'confirmation' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Revise seu Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Delivery Info */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Entrega</h4>
                    {fulfillment === 'PICKUP' ? (
                      <p>Retirada na loja</p>
                    ) : (
                      (() => {
                        const addr = addresses?.find((a: any) => a.id === selectedAddressId);
                        return addr ? (
                          <p>
                            {addr.street}, {addr.number}
                            {addr.complement && ` - ${addr.complement}`}, {addr.neighborhood}, {addr.city} - {addr.state}
                          </p>
                        ) : <p>-</p>;
                      })()
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Pagamento</h4>
                    <p>
                      {paymentMethod === 'PIX' && 'PIX'}
                      {paymentMethod === 'CREDIT_CARD' && 'Cartão de Crédito'}
                      {paymentMethod === 'CASH' && 'Dinheiro'}
                    </p>
                  </div>

                  {notes && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Observações</h4>
                      <p className="text-sm">{notes}</p>
                    </div>
                  )}

                  <Separator />

                  {/* Items */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Itens ({items.length})</h4>
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div key={item.productId} className="flex items-center gap-3">
                          <div className="relative h-12 w-12 rounded bg-muted overflow-hidden shrink-0">
                            <Image
                              src={getImageUrl(item.imageUrl)}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.quantity}x {formatCurrency(item.price)}</p>
                          </div>
                          <p className="text-sm font-bold">{formatCurrency(item.price * item.quantity)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep('payment')}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
                </Button>
                <Button
                  size="lg"
                  onClick={() => createOrderMutation.mutate()}
                  disabled={createOrderMutation.isPending}
                >
                  {createOrderMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processando...</>
                  ) : (
                    <>Confirmar Pedido</>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal ({items.length} itens)</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frete</span>
                  <span>{shipping === 0 ? <span className="text-green-600">Grátis</span> : formatCurrency(shipping)}</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
