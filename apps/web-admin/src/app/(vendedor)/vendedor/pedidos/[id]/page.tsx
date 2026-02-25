'use client';

export const dynamic = 'force-dynamic';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import {
  CheckCircle,
  AlertCircle,
  MapPin,
  Phone,
  User,
  Calendar,
  Truck,
  Loader2,
  Clock,
  Barcode,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { sellerApi } from '@/lib/api/client';

interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    barcode: string;
    imageUrl?: string;
    aisleLocation?: string;
    shelfPosition?: string;
    unit?: string;
  };
  quantity: number;
  unitPrice: number;
  status: 'PENDING' | 'PICKED';
  location?: string;
  pickedAt?: string;
}

interface PickingOrderDetail {
  id: string;
  order: {
    id: string;
    orderNumber: string;
    total: number;
    fulfillmentType?: string;
    createdAt: string;
    customer: {
      name: string;
      phone: string;
      email?: string;
    };
    deliveryMethod: string;
    deliveryAddress?: {
      street: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      state: string;
      zipCode: string;
    };
    scheduledAt?: string;
  };
  items: OrderItem[];
  status: string;
}

export default function PickingOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  const { data: order, isLoading } = useQuery<PickingOrderDetail>({
    queryKey: ['order', params.id],
    queryFn: async () => {
      const res = await sellerApi.getPickingOrder(params.id);
      return res.data;
    },
    refetchInterval: 5000,
  });

  const pickItemMutation = useMutation({
    mutationFn: async (data: { itemId: string; barcode: string }) => {
      const res = await sellerApi.scanItem(data.itemId, data.barcode);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['order', params.id] });
      setBarcodeInput('');
      const audio = new Audio('/sounds/beep-success.mp3');
      audio.play().catch(console.error);
      toast.success('✅ Item recogido!', {
        description: data.productName,
      });
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    },
    onError: (error: unknown) => {
      const audio = new Audio('/sounds/beep-error.mp3');
      audio.play().catch(console.error);
      const message = error instanceof Error ? error.message : String(error);
      toast.error('❌ ' + message || 'Erro na coleta');
      setBarcodeInput('');
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    },
  });

  const completeOrderMutation = useMutation({
    mutationFn: async () => {
      const res = await sellerApi.completePickingOrder(params.id);
      return res.data;
    },
    onSuccess: () => {
      toast.success('🎉 Pedido finalizado com sucesso!', {
        description: 'O cliente foi notificado',
        duration: 5000,
      });
      const audio = new Audio('/sounds/order-complete.mp3');
      audio.play().catch(console.error);
      queryClient.invalidateQueries({ queryKey: ['order', params.id] });
      queryClient.invalidateQueries({ queryKey: ['seller-stats'] });
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      setTimeout(() => {
        router.push('/vendedor/pedidos');
      }, 2000);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      toast.error('❌ ' + message);
    },
  });

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const item = order?.items.find(
      (i) => i.status === 'PENDING' && i.product.barcode === barcodeInput.trim(),
    );
    if (!item) {
      const audio = new Audio('/sounds/beep-error.mp3');
      audio.play().catch(console.error);
      toast.error('❌ Código de barras não encontrado', {
        description: 'Verifique se o item está pendente e o código está correto',
      });
      setBarcodeInput('');
      return;
    }
    pickItemMutation.mutate({ itemId: item.id, barcode: barcodeInput.trim() });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="ml-3 text-gray-600">Carregando pedido...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pedido não encontrado</h2>
        <p className="text-gray-600 mb-6">A ordem #{params.id} não existe ou foi removida</p>
        <button
          onClick={() => router.push('/vendedor/pedidos')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Voltar para Pedidos
        </button>
      </div>
    );
  }

  const pickedItems = order.items.filter((i) => i.status === 'PICKED').length;
  const totalItems = order.items.length;
  const progress = totalItems > 0 ? (pickedItems / totalItems) * 100 : 0;
  const allPicked = pickedItems === totalItems;

  return (
    <div className="space-y-6">
      {/* Header do Pedido */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Pedido #{order.order.orderNumber}
            </h1>
            <p className="text-gray-600 mt-1">Preparação do pedido</p>
          </div>

          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              R$ {order.order.total.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {order.items.length} items
            </div>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold text-gray-900">
              Progresso: {pickedItems}/{totalItems} items
            </span>
            <span className="font-semibold text-blue-600">
              {progress.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Info do Cliente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
          <div className="flex items-start gap-3">
            <User className="text-gray-400 mt-1 flex-shrink-0" size={20} />
            <div>
              <p className="text-sm text-gray-600">Cliente</p>
              <p className="font-medium text-gray-900">{order.order.customer.name}</p>
              {order.order.customer.email && (
                <p className="text-sm text-gray-600">{order.order.customer.email}</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="text-gray-400 mt-1 flex-shrink-0" size={20} />
            <div>
              <p className="text-sm text-gray-600">Telefone</p>
              <p className="font-medium text-gray-900">{order.order.customer.phone}</p>
            </div>
          </div>

          {order.order.deliveryMethod === 'HOME_DELIVERY' && order.order.deliveryAddress && (
            <div className="flex items-start gap-3 md:col-span-2">
              <MapPin className="text-gray-400 mt-1 flex-shrink-0" size={20} />
              <div>
                <p className="text-sm text-gray-600">Endereço de entrega</p>
                <p className="font-medium text-gray-900">
                  {order.order.deliveryAddress.street}, {order.order.deliveryAddress.number}
                  {order.order.deliveryAddress.complement && ` - ${order.order.deliveryAddress.complement}`}
                </p>
                <p className="text-sm text-gray-600">
                  {order.order.deliveryAddress.neighborhood}, {order.order.deliveryAddress.city} - {order.order.deliveryAddress.state}
                </p>
                <p className="text-sm text-gray-600">
                  CEP: {order.order.deliveryAddress.zipCode}
                </p>
              </div>
            </div>
          )}

          {order.order.deliveryMethod === 'STORE_PICKUP' && (
            <div className="flex items-start gap-3">
              <Truck className="text-gray-400 mt-1 flex-shrink-0" size={20} />
              <div>
                <p className="text-sm text-gray-600">Método de entrega</p>
                <p className="font-medium text-gray-900">🏪 Retirada na loja</p>
              </div>
            </div>
          )}

          {order.order.scheduledAt && (
            <div className="flex items-start gap-3">
              <Calendar className="text-gray-400 mt-1 flex-shrink-0" size={20} />
              <div>
                <p className="text-sm text-gray-600">Agendamento</p>
                <p className="font-medium text-gray-900">
                  {new Date(order.order.scheduledAt).toLocaleString('pt-BR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scanner de Código de Barras */}
      {!allPicked && (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm p-6 border-2 border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Barcode className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Escanear Produto
              </h2>
              <p className="text-sm text-gray-600">
                Use o leitor de código de barras ou digite manualmente
              </p>
            </div>
          </div>

          <form onSubmit={handleBarcodeSubmit} className="flex gap-3">
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Digite ou escaneie o código de barras..."
              className="flex-1 px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-mono"
              disabled={pickItemMutation.isPending}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={pickItemMutation.isPending || !barcodeInput.trim()}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg transition"
            >
              {pickItemMutation.isPending ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                'Marcar'
              )}
            </button>
          </form>

          <p className="text-sm text-blue-700 mt-3 flex items-center gap-2">
            <AlertCircle size={16} />
            <span>Mantenha o foco neste campo para usar o leitor de código de barras</span>
          </p>
        </div>
      )}

      {/* Lista de Items */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Items do Pedido</h2>
          <p className="text-sm text-gray-600 mt-1">
            {pickedItems} de {totalItems} items recogidos
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {order.items.map((item, index) => (
            <div
              key={item.id}
              className={`px-6 py-5 transition ${
                item.status === 'PICKED' 
                  ? 'bg-green-50' 
                  : index === 0 && !allPicked
                  ? 'bg-yellow-50'
                  : 'bg-white'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {item.status === 'PICKED' ? (
                    <div className="bg-green-500 rounded-full p-2">
                      <CheckCircle className="text-white" size={24} />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full border-3 border-gray-300 flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-400">
                        {index + 1}
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Image */}
                {item.product.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                  />
                )}

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {item.product.name}
                  </h3>
                  <p className="text-sm text-gray-600 font-mono mt-1">
                    📊 Código: {item.product.barcode}
                  </p>
                  {item.product.aisleLocation && (
                    <p className="text-sm text-gray-600 mt-1">
                      📍 Localização: <span className="font-medium">{item.product.aisleLocation}</span>
                    </p>
                  )}
                  {item.status === 'PICKED' && item.pickedAt && (
                    <p className="text-sm text-green-700 mt-1 flex items-center gap-1">
                      <Clock size={14} />
                      Recogido às {new Date(item.pickedAt).toLocaleTimeString('pt-BR')}
                    </p>
                  )}
                </div>

                {/* Quantity & Price */}
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-gray-900">
                    Qty: {item.quantity}
                  </p>
                  <p className="text-sm text-gray-600">
                    R$ {item.unitPrice.toFixed(2)} c/u
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    Total: R$ {(item.quantity * item.unitPrice).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botón de Finalizar */}
      {allPicked && (
        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-lg p-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-green-500 p-4 rounded-full">
                <CheckCircle className="text-white" size={40} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Todos os items foram recogidos! 🎉
                </h3>
                <p className="text-gray-700 mt-1">
                  Finalize o pedido para notificar o cliente
                </p>
              </div>
            </div>

            <button
              onClick={() => completeOrderMutation.mutate()}
              disabled={completeOrderMutation.isPending}
              className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-lg shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              {completeOrderMutation.isPending ? (
                <> 
                    <Loader2 className="animate-spin" size={24} />
                    Finalizando...
                </>
              ) : (
                <>
                  <CheckCircle size={24} />
                  Finalizar Pedido
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
