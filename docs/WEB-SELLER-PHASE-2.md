# GUÍA PASO A PASO: Dashboard del Vendedor - FASE 2
## Detalle de Pedido, Picking y Notificaciones en Tiempo Real

## 🎯 OBJETIVO DE ESTA FASE

Implementar la funcionalidad completa de preparación de pedidos:
1. Página de detalle del pedido con todos los items
2. Input para escanear códigos de barras
3. Sistema que valida y marca items como recogidos
4. Barra de progreso en tiempo real
5. Botón para finalizar pedido
6. Notificaciones en tiempo real con WebSocket
7. Sonidos de feedback

**PREREQUISITO**: Haber completado la Fase 1 (WEB-SELLER-STEP-BY-STEP.md)

---

## 📋 VERIFICACIÓN ANTES DE COMENZAR

### Asegúrate de que la Fase 1 esté completa:

```bash
# Verificar que estos archivos existen:
ls apps/web-admin/app/\(vendedor\)/vendedor/layout.tsx
ls apps/web-admin/app/\(vendedor\)/vendedor/page.tsx
ls apps/web-admin/app/\(vendedor\)/vendedor/pedidos/page.tsx

# Verificar que el backend funciona:
curl http://localhost:3000/api/seller/stats
curl http://localhost:3000/api/seller/orders
```

Si algún archivo no existe o los endpoints no responden, **primero completa la Fase 1**.

### Dependencias Adicionales Necesarias

Verificar e instalar si faltan:

```bash
cd apps/web-admin

# Verificar socket.io-client
pnpm list socket.io-client

# Si no está, instalar:
pnpm add socket.io-client

# Verificar sonner (toasts)
pnpm list sonner

# Si no está, instalar:
pnpm add sonner
```

---

## PASO 1: CREAR BIBLIOTECA DE SOCKET.IO

### Archivo: `apps/web-admin/lib/socket.ts`

**ACCIÓN**: CREAR archivo nuevo

**UBICACIÓN EXACTA**: `apps/web-admin/lib/socket.ts`

**QUÉ HACE**: Configuración centralizada de WebSocket para reutilizar en toda la app

**CÓDIGO COMPLETO**:

```typescript
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeSocket = (token: string) => {
  // Si ya existe conexión activa, retornarla
  if (socket?.connected) {
    return socket;
  }

  // Crear nueva conexión
  socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000', {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  // Eventos de conexión
  socket.on('connect', () => {
    console.log('✅ WebSocket conectado');
  });

  socket.on('disconnect', () => {
    console.log('❌ WebSocket desconectado');
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Error de conexión WebSocket:', error);
  });

  socket.on('error', (error) => {
    console.error('❌ Error WebSocket:', error);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket no inicializado. Llama a initializeSocket() primero.');
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('🔌 Socket desconectado manualmente');
  }
};
```

---

## PASO 2: CREAR HOOK DE NOTIFICACIONES

### Archivo: `apps/web-admin/hooks/useSellerNotifications.ts`

**ACCIÓN**: CREAR archivo nuevo

**UBICACIÓN EXACTA**: `apps/web-admin/hooks/useSellerNotifications.ts`

**QUÉ HACE**: Hook personalizado que escucha eventos de WebSocket y muestra notificaciones

**CÓDIGO COMPLETO**:

```typescript
'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { initializeSocket, disconnectSocket } from '@/lib/socket';

export const useSellerNotifications = () => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Solo para vendedores autenticados
    if (!session?.user || session.user.role !== 'SELLER') {
      return;
    }

    // Inicializar socket
    const socket = initializeSocket(session.accessToken);

    // ========================================
    // EVENTO: Nuevo pedido creado
    // ========================================
    socket.on('order:new', (order) => {
      // Reproducir sonido
      playNotificationSound('new-order');

      // Mostrar notificación
      toast.success('🛒 Novo pedido recebido!', {
        description: `Pedido #${order.orderNumber} - ${order.items?.length || 0} items - R$ ${order.total?.toFixed(2) || '0.00'}`,
        duration: 8000,
        action: {
          label: 'Ver Pedido',
          onClick: () => {
            window.location.href = `/vendedor/pedidos/${order.id}`;
          },
        },
      });

      // Refrescar queries
      queryClient.invalidateQueries({ queryKey: ['seller-stats'] });
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      queryClient.invalidateQueries({ queryKey: ['pending-orders-preview'] });
    });

    // ========================================
    // EVENTO: Pedido cancelado
    // ========================================
    socket.on('order:cancelled', (data) => {
      playNotificationSound('cancelled');

      toast.error('❌ Pedido cancelado', {
        description: `Pedido #${data.orderNumber} foi cancelado pelo cliente`,
        duration: 5000,
      });

      // Refrescar queries
      queryClient.invalidateQueries({ queryKey: ['seller-stats'] });
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      queryClient.invalidateQueries({ queryKey: ['pending-orders-preview'] });
      queryClient.invalidateQueries({ queryKey: ['order', data.orderId] });
    });

    // ========================================
    // EVENTO: Cambio de estado del pedido
    // ========================================
    socket.on('order:status-changed', (data) => {
      const statusMessages: Record<string, { emoji: string; title: string; description: string }> = {
        ASSIGNED: {
          emoji: '🚗',
          title: 'Entregador atribuído',
          description: `${data.driverName || 'Um entregador'} aceitou o pedido #${data.orderNumber}`,
        },
        OUT_FOR_DELIVERY: {
          emoji: '📦',
          title: 'Pedido saiu para entrega',
          description: `Pedido #${data.orderNumber} está a caminho do cliente`,
        },
        DELIVERED: {
          emoji: '✅',
          title: 'Pedido entregue',
          description: `Pedido #${data.orderNumber} foi entregue com sucesso`,
        },
        READY_FOR_PICKUP: {
          emoji: '🏪',
          title: 'Pronto para retirada',
          description: `Pedido #${data.orderNumber} aguarda retirada do cliente`,
        },
      };

      const message = statusMessages[data.status];
      if (message) {
        playNotificationSound('status-change');

        toast.info(`${message.emoji} ${message.title}`, {
          description: message.description,
          duration: 5000,
        });

        // Refrescar queries
        queryClient.invalidateQueries({ queryKey: ['seller-stats'] });
        queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
        queryClient.invalidateQueries({ queryKey: ['order', data.orderId] });
      }
    });

    // ========================================
    // EVENTO: Item marcado como recogido
    // ========================================
    socket.on('order:item-picked', (data) => {
      // Solo refrescar si estamos viendo ese pedido
      queryClient.invalidateQueries({ queryKey: ['order', data.orderId] });
    });

    // ========================================
    // EVENTO: Pedido completado
    // ========================================
    socket.on('order:picking-completed', (data) => {
      toast.success('✅ Pedido finalizado!', {
        description: `Pedido #${data.orderNumber} está pronto`,
        duration: 5000,
      });

      queryClient.invalidateQueries({ queryKey: ['seller-stats'] });
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', data.orderId] });
    });

    // Cleanup al desmontar
    return () => {
      socket.off('order:new');
      socket.off('order:cancelled');
      socket.off('order:status-changed');
      socket.off('order:item-picked');
      socket.off('order:picking-completed');
      disconnectSocket();
    };
  }, [session, queryClient]);
};

// ========================================
// Función auxiliar para reproducir sonidos
// ========================================
const playNotificationSound = (
  type: 'new-order' | 'cancelled' | 'status-change' | 'beep-success' | 'beep-error'
) => {
  const sounds: Record<string, string> = {
    'new-order': '/sounds/new-order.mp3',
    'cancelled': '/sounds/cancelled.mp3',
    'status-change': '/sounds/notification.mp3',
    'beep-success': '/sounds/beep-success.mp3',
    'beep-error': '/sounds/beep-error.mp3',
  };

  const audio = new Audio(sounds[type]);
  audio.volume = 0.6;
  audio.play().catch((error) => {
    console.error('Error al reproducir sonido:', error);
  });
};
```

---

## PASO 3: INTEGRAR NOTIFICACIONES EN EL LAYOUT

### Archivo: `apps/web-admin/app/(vendedor)/vendedor/layout.tsx`

**ACCIÓN**: MODIFICAR archivo existente

**UBICACIÓN EXACTA**: `apps/web-admin/app/(vendedor)/vendedor/layout.tsx`

**INSTRUCCIONES**:
1. **ABRIR** el archivo existente
2. **AGREGAR** import del hook al inicio
3. **AGREGAR** llamada al hook dentro del componente
4. **AGREGAR** Toaster de sonner

**CÓDIGO A AGREGAR**:

```typescript
// AGREGAR estos imports al inicio del archivo
import { useSellerNotifications } from '@/hooks/useSellerNotifications';
import { Toaster } from 'sonner';

// Dentro del componente, DESPUÉS de los useEffect existentes, AGREGAR:
export default function VendedorLayout({ children }) {
  // ... código existente ...

  // AGREGAR esta línea (después de los otros hooks):
  useSellerNotifications();

  // ... resto del código existente ...

  return (
    <div className="min-h-screen bg-gray-50">
      {/* AGREGAR Toaster al inicio del div */}
      <Toaster position="top-right" richColors />
      
      {/* ... resto del JSX existente ... */}
    </div>
  );
}
```

**ARCHIVO COMPLETO DEBERÍA QUEDAR ASÍ**:

```typescript
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingCart, Package, History, LogOut, Home } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { useSellerNotifications } from '@/hooks/useSellerNotifications'; // NUEVO
import { Toaster } from 'sonner'; // NUEVO

export default function VendedorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Hook de notificaciones - NUEVO
  useSellerNotifications();

  // ... resto del código existente sin cambios ...

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toaster para notificaciones - NUEVO */}
      <Toaster position="top-right" richColors />
      
      {/* ... resto del JSX existente sin cambios ... */}
    </div>
  );
}
```

---

## PASO 4: CREAR PÁGINA DE DETALLE DEL PEDIDO

### Archivo: `apps/web-admin/app/(vendedor)/vendedor/pedidos/[id]/page.tsx`

**ACCIÓN**: CREAR archivo nuevo

**UBICACIÓN EXACTA**: `apps/web-admin/app/(vendedor)/vendedor/pedidos/[id]/page.tsx`

**QUÉ HACE**: 
- Muestra detalle completo del pedido
- Lista de todos los items con estados (pendiente/recogido)
- Input para escanear código de barras
- Barra de progreso
- Botón para finalizar cuando todos los items estén recogidos

**CÓDIGO COMPLETO**:

```typescript
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  Package, 
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

interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    barcode: string;
    imageUrl?: string;
  };
  quantity: number;
  unitPrice: number;
  status: 'PENDING' | 'PICKED';
  location?: string;
  pickedAt?: string;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  deliveryAddress?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  items: OrderItem[];
  total: number;
  createdAt: string;
  scheduledAt?: string;
  deliveryMethod: string;
}

export default function OrderDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  // Auto-focus en el input de código de barras
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Fetch del pedido
  const { data: order, isLoading } = useQuery<OrderDetail>({
    queryKey: ['order', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/seller/orders/${params.id}`);
      if (!res.ok) throw new Error('Error al cargar pedido');
      return res.json();
    },
    refetchInterval: 5000, // Refrescar cada 5 segundos
  });

  // Mutation para marcar item como recogido
  const pickItemMutation = useMutation({
    mutationFn: async (data: { itemId: string; barcode: string }) => {
      const res = await fetch(`/api/seller/picking/items/${data.itemId}/pick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: data.barcode }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error al marcar item');
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      // Refrescar pedido
      queryClient.invalidateQueries({ queryKey: ['order', params.id] });
      
      // Limpiar input
      setBarcodeInput('');
      
      // Sonido de éxito
      const audio = new Audio('/sounds/beep-success.mp3');
      audio.play().catch(console.error);
      
      // Toast de éxito
      toast.success('✅ Item recogido!', {
        description: data.productName,
      });
      
      // Re-focus en el input
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    },
    onError: (error: Error) => {
      // Sonido de error
      const audio = new Audio('/sounds/beep-error.mp3');
      audio.play().catch(console.error);
      
      // Toast de error
      toast.error('❌ ' + error.message);
      
      // Limpiar input
      setBarcodeInput('');
      
      // Re-focus
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    },
  });

  // Mutation para finalizar pedido
  const completeOrderMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/seller/orders/${params.id}/complete-picking`, {
        method: 'POST',
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error al finalizar pedido');
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast.success('🎉 Pedido finalizado com sucesso!', {
        description: 'O cliente foi notificado',
        duration: 5000,
      });
      
      // Sonido de éxito
      const audio = new Audio('/sounds/order-complete.mp3');
      audio.play().catch(console.error);
      
      // Refrescar queries
      queryClient.invalidateQueries({ queryKey: ['order', params.id] });
      queryClient.invalidateQueries({ queryKey: ['seller-stats'] });
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      
      // Redirigir a la lista después de 2 segundos
      setTimeout(() => {
        router.push('/vendedor/pedidos');
      }, 2000);
    },
    onError: (error: Error) => {
      toast.error('❌ ' + error.message);
    },
  });

  // Manejar submit del código de barras
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!barcodeInput.trim()) return;
    
    // Buscar item pendiente con ese código de barras
    const item = order?.items.find(
      (i) => i.status === 'PENDING' && i.product.barcode === barcodeInput.trim()
    );
    
    if (!item) {
      // Sonido de error
      const audio = new Audio('/sounds/beep-error.mp3');
      audio.play().catch(console.error);
      
      toast.error('❌ Código de barras não encontrado', {
        description: 'Verifique se o item está pendente e o código está correto',
      });
      
      setBarcodeInput('');
      return;
    }
    
    // Marcar item
    pickItemMutation.mutate({ itemId: item.id, barcode: barcodeInput.trim() });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="ml-3 text-gray-600">Carregando pedido...</p>
      </div>
    );
  }

  // Not found
  if (!order) {
    return (
      <div className="text-center py-20">
        <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pedido não encontrado</h2>
        <p className="text-gray-600 mb-6">O pedido #{params.id} não existe ou foi removido</p>
        <button
          onClick={() => router.push('/vendedor/pedidos')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Voltar para Pedidos
        </button>
      </div>
    );
  }

  // Calcular progreso
  const pickedItems = order.items.filter((i) => i.status === 'PICKED').length;
  const totalItems = order.items.length;
  const progress = totalItems > 0 ? (pickedItems / totalItems) * 100 : 0;
  const allPicked = pickedItems === totalItems;

  return (
    <div className="space-y-6">
      {/* Header del Pedido */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Pedido #{order.orderNumber}
            </h1>
            <p className="text-gray-600 mt-1">Preparação do pedido</p>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              R$ {order.total.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {order.items.length} items
            </div>
          </div>
        </div>

        {/* Barra de Progreso */}
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

        {/* Info del Cliente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
          <div className="flex items-start gap-3">
            <User className="text-gray-400 mt-1 flex-shrink-0" size={20} />
            <div>
              <p className="text-sm text-gray-600">Cliente</p>
              <p className="font-medium text-gray-900">{order.customer.name}</p>
              {order.customer.email && (
                <p className="text-sm text-gray-600">{order.customer.email}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Phone className="text-gray-400 mt-1 flex-shrink-0" size={20} />
            <div>
              <p className="text-sm text-gray-600">Telefone</p>
              <p className="font-medium text-gray-900">{order.customer.phone}</p>
            </div>
          </div>
          
          {order.deliveryMethod === 'HOME_DELIVERY' && order.deliveryAddress && (
            <div className="flex items-start gap-3 md:col-span-2">
              <MapPin className="text-gray-400 mt-1 flex-shrink-0" size={20} />
              <div>
                <p className="text-sm text-gray-600">Endereço de entrega</p>
                <p className="font-medium text-gray-900">
                  {order.deliveryAddress.street}, {order.deliveryAddress.number}
                  {order.deliveryAddress.complement && ` - ${order.deliveryAddress.complement}`}
                </p>
                <p className="text-sm text-gray-600">
                  {order.deliveryAddress.neighborhood}, {order.deliveryAddress.city} - {order.deliveryAddress.state}
                </p>
                <p className="text-sm text-gray-600">
                  CEP: {order.deliveryAddress.zipCode}
                </p>
              </div>
            </div>
          )}
          
          {order.deliveryMethod === 'STORE_PICKUP' && (
            <div className="flex items-start gap-3">
              <Truck className="text-gray-400 mt-1 flex-shrink-0" size={20} />
              <div>
                <p className="text-sm text-gray-600">Método de entrega</p>
                <p className="font-medium text-gray-900">🏪 Retirada na loja</p>
              </div>
            </div>
          )}
          
          {order.scheduledAt && (
            <div className="flex items-start gap-3">
              <Calendar className="text-gray-400 mt-1 flex-shrink-0" size={20} />
              <div>
                <p className="text-sm text-gray-600">Agendamento</p>
                <p className="font-medium text-gray-900">
                  {new Date(order.scheduledAt).toLocaleString('pt-BR', {
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
                  {item.location && (
                    <p className="text-sm text-gray-600 mt-1">
                      📍 Localização: <span className="font-medium">{item.location}</span>
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
```

---

## PASO 5: CREAR ENDPOINT PARA OBTENER DETALLE DEL PEDIDO

### Archivo: `apps/backend/src/modules/seller/seller.controller.ts`

**ACCIÓN**: AGREGAR método al controller existente

**CÓDIGO A AGREGAR**:

```typescript
@Get('orders/:id')
@Roles(Role.SELLER, Role.ADMIN, Role.MANAGER)
async getOrderDetail(@Param('id') id: string) {
  return this.sellerService.getOrderDetail(id);
}
```

---

## PASO 6: CREAR MÉTODO EN EL SERVICE

### Archivo: `apps/backend/src/modules/seller/seller.service.ts`

**ACCIÓN**: AGREGAR método al service existente

**CÓDIGO A AGREGAR**:

```typescript
async getOrderDetail(orderId: string) {
  const order = await this.prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: {
        select: {
          name: true,
          phone: true,
          email: true,
        },
      },
      deliveryAddress: true,
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              barcode: true,
              imageUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (!order) {
    throw new Error('Pedido não encontrado');
  }

  return order;
}
```

---

## PASO 7: CREAR CONTROLLER DE PICKING

### Archivo: `apps/backend/src/modules/picking/picking.controller.ts`

**ACCIÓN**: CREAR archivo nuevo

**UBICACIÓN EXACTA**: `apps/backend/src/modules/picking/picking.controller.ts`

**CÓDIGO COMPLETO**:

```typescript
import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Role } from '@prisma/client';
import { PickingService } from './picking.service';

@Controller('seller/picking')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PickingController {
  constructor(private readonly pickingService: PickingService) {}

  @Post('items/:itemId/pick')
  @Roles(Role.SELLER, Role.ADMIN, Role.MANAGER)
  async pickItem(
    @Param('itemId') itemId: string,
    @Body() body: { barcode: string },
    @GetUser('id') userId: string,
  ) {
    return this.pickingService.pickItem(itemId, body.barcode, userId);
  }
}
```

---

## PASO 8: CREAR SERVICE DE PICKING

### Archivo: `apps/backend/src/modules/picking/picking.service.ts`

**ACCIÓN**: CREAR archivo nuevo

**UBICACIÓN EXACTA**: `apps/backend/src/modules/picking/picking.service.ts`

**CÓDIGO COMPLETO**:

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersGateway } from '../orders/orders.gateway';

@Injectable()
export class PickingService {
  constructor(
    private prisma: PrismaService,
    private ordersGateway: OrdersGateway,
  ) {}

  async pickItem(itemId: string, barcode: string, userId: string) {
    // Buscar el item del pedido
    const item = await this.prisma.orderItem.findUnique({
      where: { id: itemId },
      include: {
        product: true,
        order: true,
      },
    });

    if (!item) {
      throw new BadRequestException('Item não encontrado');
    }

    // Verificar que el código de barras coincida
    if (item.product.barcode !== barcode) {
      throw new BadRequestException(
        `Código de barras incorreto. Esperado: ${item.product.barcode}`
      );
    }

    // Verificar que no esté ya recogido
    if (item.status === 'PICKED') {
      throw new BadRequestException('Este item já foi recogido');
    }

    // Marcar como recogido
    const updatedItem = await this.prisma.orderItem.update({
      where: { id: itemId },
      data: {
        status: 'PICKED',
        pickedAt: new Date(),
        pickedBy: userId,
      },
      include: {
        product: true,
      },
    });

    // Actualizar estado del pedido si es el primero
    if (item.order.status === 'CONFIRMED') {
      await this.prisma.order.update({
        where: { id: item.orderId },
        data: {
          status: 'PICKING',
          sellerId: userId,
        },
      });
    }

    // Emitir evento via WebSocket
    this.ordersGateway.notifyItemPicked({
      orderId: item.orderId,
      itemId: item.id,
      productName: item.product.name,
    });

    return {
      success: true,
      item: updatedItem,
      productName: item.product.name,
    };
  }
}
```

---

## PASO 9: CREAR ENDPOINT PARA FINALIZAR PEDIDO

### Archivo: `apps/backend/src/modules/seller/seller.controller.ts`

**ACCIÓN**: AGREGAR método al controller existente

**CÓDIGO A AGREGAR**:

```typescript
@Post('orders/:id/complete-picking')
@Roles(Role.SELLER, Role.ADMIN, Role.MANAGER)
async completeOrderPicking(@Param('id') id: string) {
  return this.sellerService.completeOrderPicking(id);
}
```

---

## PASO 10: CREAR MÉTODO PARA FINALIZAR EN SERVICE

### Archivo: `apps/backend/src/modules/seller/seller.service.ts`

**ACCIÓN**: AGREGAR método al service existente

**CÓDIGO A AGREGAR**:

```typescript
async completeOrderPicking(orderId: string) {
  // Verificar que el pedido existe
  const order = await this.prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
    },
  });

  if (!order) {
    throw new Error('Pedido não encontrado');
  }

  // Verificar que todos los items estén recogidos
  const allPicked = order.items.every((item) => item.status === 'PICKED');

  if (!allPicked) {
    throw new Error('Ainda há items pendentes de recolher');
  }

  // Determinar próximo estado según método de entrega
  const nextStatus = order.deliveryMethod === 'STORE_PICKUP'
    ? 'READY_FOR_PICKUP'
    : 'READY_FOR_DELIVERY';

  // Actualizar estado del pedido
  const updatedOrder = await this.prisma.order.update({
    where: { id: orderId },
    data: {
      status: nextStatus,
    },
  });

  // Emitir evento via WebSocket
  // (esto notificará al vendedor que el pedido está completo)
  // También se puede notificar al cliente aquí

  return {
    success: true,
    order: updatedOrder,
    message: 'Pedido finalizado com sucesso',
  };
}
```

---

## PASO 11: CREAR MODULE DE PICKING

### Archivo: `apps/backend/src/modules/picking/picking.module.ts`

**ACCIÓN**: CREAR archivo nuevo

**UBICACIÓN EXACTA**: `apps/backend/src/modules/picking/picking.module.ts`

**CÓDIGO COMPLETO**:

```typescript
import { Module } from '@nestjs/common';
import { PickingController } from './picking.controller';
import { PickingService } from './picking.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [PrismaModule, OrdersModule],
  controllers: [PickingController],
  providers: [PickingService],
  exports: [PickingService],
})
export class PickingModule {}
```

---

## PASO 12: CREAR GATEWAY DE WEBSOCKET

### Archivo: `apps/backend/src/modules/orders/orders.gateway.ts`

**ACCIÓN**: CREAR archivo nuevo (si no existe) o MODIFICAR si existe

**UBICACIÓN EXACTA**: `apps/backend/src/modules/orders/orders.gateway.ts`

**CÓDIGO COMPLETO**:

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      
      // Guardar userId y role en el socket
      client.data.userId = payload.sub;
      client.data.role = payload.role;
      
      // Unir a rooms según rol
      if (payload.role === 'SELLER') {
        client.join('sellers');
        console.log(`✅ Vendedor conectado: ${payload.sub}`);
      } else if (payload.role === 'DELIVERY') {
        client.join('drivers');
        console.log(`✅ Repartidor conectado: ${payload.sub}`);
      } else if (payload.role === 'ADMIN' || payload.role === 'MANAGER') {
        client.join('admins');
        console.log(`✅ Admin conectado: ${payload.sub}`);
      }
      
    } catch (error) {
      console.error('❌ Error en autenticación WebSocket:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ Cliente desconectado: ${client.data.userId}`);
  }

  // ========================================
  // MÉTODOS PARA EMITIR EVENTOS
  // ========================================

  // Notificar nuevo pedido a vendedores
  notifyNewOrder(order: any) {
    this.server.to('sellers').emit('order:new', order);
    console.log(`📢 Nuevo pedido notificado a vendedores: #${order.orderNumber}`);
  }

  // Notificar pedido cancelado
  notifyOrderCancelled(data: { orderId: string; orderNumber: string }) {
    this.server.to('sellers').emit('order:cancelled', data);
    console.log(`📢 Pedido cancelado notificado: #${data.orderNumber}`);
  }

  // Notificar cambio de estado del pedido
  notifyOrderStatusChanged(data: {
    orderId: string;
    orderNumber: string;
    status: string;
    driverName?: string;
  }) {
    this.server.to('sellers').emit('order:status-changed', data);
    console.log(`📢 Cambio de estado notificado: #${data.orderNumber} -> ${data.status}`);
  }

  // Notificar item recogido
  notifyItemPicked(data: {
    orderId: string;
    itemId: string;
    productName: string;
  }) {
    this.server.to('sellers').emit('order:item-picked', data);
    console.log(`📢 Item recogido: ${data.productName}`);
  }

  // Notificar picking completado
  notifyPickingCompleted(data: {
    orderId: string;
    orderNumber: string;
  }) {
    this.server.to('sellers').emit('order:picking-completed', data);
    console.log(`📢 Picking completado: #${data.orderNumber}`);
  }
}
```

---

## PASO 13: REGISTRAR MÓDULOS EN APP.MODULE

### Archivo: `apps/backend/src/app.module.ts`

**ACCIÓN**: AGREGAR imports

**CÓDIGO A AGREGAR** (en el array de imports):

```typescript
import { PickingModule } from './modules/picking/picking.module';

@Module({
  imports: [
    // ... otros imports existentes
    PickingModule, // AGREGAR esta línea
  ],
  // ...
})
```

---

## PASO 14: AGREGAR ARCHIVOS DE SONIDO

### Archivos de Audio Necesarios

**ACCIÓN**: DESCARGAR o CREAR archivos de audio

**UBICACIÓN**: `apps/web-admin/public/sounds/`

**ARCHIVOS NECESARIOS**:

1. `new-order.mp3` - Sonido para nuevo pedido (alertante pero agradable)
2. `beep-success.mp3` - Sonido cuando escanea correctamente (beep corto)
3. `beep-error.mp3` - Sonido de error al escanear (beep de error)
4. `notification.mp3` - Sonido genérico de notificación
5. `cancelled.mp3` - Sonido de cancelación
6. `order-complete.mp3` - Sonido de pedido completado (celebración)

**INSTRUCCIONES PARA OBTENER SONIDOS**:

Opción 1 - Descargar de sitios gratuitos:
- [Zapsplat](https://www.zapsplat.com/) 
- [Freesound](https://freesound.org/)
- [Mixkit](https://mixkit.co/free-sound-effects/)

Buscar:
- "success beep" para beep-success
- "error beep" para beep-error
- "notification" para notification
- "cash register" o "ding" para new-order
- "completion" o "achievement" para order-complete

Opción 2 - Crear archivos temporales de prueba:
```bash
# Crear carpeta
mkdir -p apps/web-admin/public/sounds

# Crear archivos vacíos (solo para testing)
touch apps/web-admin/public/sounds/new-order.mp3
touch apps/web-admin/public/sounds/beep-success.mp3
touch apps/web-admin/public/sounds/beep-error.mp3
touch apps/web-admin/public/sounds/notification.mp3
touch apps/web-admin/public/sounds/cancelled.mp3
touch apps/web-admin/public/sounds/order-complete.mp3
```

**NOTA**: Los archivos deben ser:
- Formato: MP3
- Duración: < 2 segundos
- Tamaño: < 100KB cada uno
- Calidad: 128kbps es suficiente

---

## PASO 15: ACTUALIZAR SCHEMA PRISMA

### Archivo: `apps/backend/prisma/schema.prisma`

**ACCIÓN**: MODIFICAR modelo OrderItem

**INSTRUCCIONES**:
1. Buscar el modelo `OrderItem`
2. Agregar campos para tracking de picking

**CÓDIGO A AGREGAR** (dentro del modelo OrderItem):

```prisma
model OrderItem {
  id        String   @id @default(uuid())
  orderId   String
  productId String
  quantity  Int
  unitPrice Decimal  @db.Decimal(10, 2)
  
  // AGREGAR ESTOS CAMPOS:
  status    String   @default("PENDING") // "PENDING" | "PICKED"
  location  String?  // Ubicación en almacén
  pickedAt  DateTime?
  pickedBy  String?  // ID del vendedor que recogió
  
  // Relaciones existentes
  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([orderId])
  @@index([productId])
  @@index([status]) // AGREGAR índice
}
```

**DESPUÉS DE MODIFICAR**:

```bash
# Ejecutar migración
cd apps/backend
pnpm prisma migrate dev --name add-picking-fields
pnpm prisma generate
```

---

## PASO 16: CREAR VARIABLE DE ENTORNO

### Archivo: `apps/web-admin/.env.local`

**ACCIÓN**: CREAR o MODIFICAR archivo

**CÓDIGO A AGREGAR**:

```bash
# WebSocket URL para notificaciones en tiempo real
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

**PARA PRODUCCIÓN** (cuando hagas deploy):
```bash
NEXT_PUBLIC_WS_URL=https://tu-api-backend.com
```

---

## ✅ RESUMEN DE ARCHIVOS CREADOS/MODIFICADOS

### FRONTEND (Web Admin)

**Archivos CREADOS**:
1. `apps/web-admin/lib/socket.ts`
2. `apps/web-admin/hooks/useSellerNotifications.ts`
3. `apps/web-admin/app/(vendedor)/vendedor/pedidos/[id]/page.tsx`
4. `apps/web-admin/.env.local` (si no existe)

**Archivos MODIFICADOS**:
5. `apps/web-admin/app/(vendedor)/vendedor/layout.tsx`

**Archivos de AUDIO** (a descargar/crear):
6. `apps/web-admin/public/sounds/*.mp3` (6 archivos)

### BACKEND

**Archivos CREADOS**:
7. `apps/backend/src/modules/picking/picking.module.ts`
8. `apps/backend/src/modules/picking/picking.controller.ts`
9. `apps/backend/src/modules/picking/picking.service.ts`
10. `apps/backend/src/modules/orders/orders.gateway.ts`

**Archivos MODIFICADOS**:
11. `apps/backend/src/modules/seller/seller.controller.ts` (agregar 2 endpoints)
12. `apps/backend/src/modules/seller/seller.service.ts` (agregar 2 métodos)
13. `apps/backend/src/app.module.ts` (agregar PickingModule)
14. `apps/backend/prisma/schema.prisma` (agregar campos a OrderItem)

---

## 🧪 CÓMO PROBAR LA FASE 2

### Test 1: Ver Detalle del Pedido
1. Login como vendedor
2. Ir a "Pedidos Online"
3. Click en un pedido
4. Debe mostrar:
   - ✅ Información completa del pedido
   - ✅ Lista de todos los items
   - ✅ Barra de progreso
   - ✅ Input de código de barras con auto-focus

### Test 2: Escanear Items
1. En la página de detalle
2. Digitar código de barras de un producto del pedido
3. Presionar Enter o click en "Marcar"
4. Debe:
   - ✅ Reproducir sonido de éxito
   - ✅ Marcar item como recogido (fondo verde)
   - ✅ Actualizar barra de progreso
   - ✅ Limpiar input y mantener focus

### Test 3: Código Incorrecto
1. Digitar código de barras que NO esté en el pedido
2. Presionar Enter
3. Debe:
   - ✅ Reproducir sonido de error
   - ✅ Mostrar toast de error
   - ✅ NO marcar ningún item

### Test 4: Finalizar Pedido
1. Escanear todos los items del pedido
2. Al llegar a 100%, debe aparecer card verde
3. Click en "Finalizar Pedido"
4. Debe:
   - ✅ Mostrar toast de éxito
   - ✅ Reproducir sonido de celebración
   - ✅ Redirigir a lista de pedidos después de 2 segundos

### Test 5: Notificaciones en Tiempo Real
1. Abrir dashboard del vendedor en navegador
2. Crear nuevo pedido desde app móvil o web cliente
3. Debe:
   - ✅ Aparecer notificación toast en tiempo real
   - ✅ Reproducir sonido "new-order"
   - ✅ Actualizar contador de pedidos pendientes
   - ✅ Aparecer en la lista automáticamente

### Test 6: Multi-tab
1. Abrir pedido en 2 tabs del navegador
2. Escanear item en una tab
3. La otra tab debe:
   - ✅ Actualizar automáticamente (refetch cada 5s)
   - ✅ Mostrar item como recogido

---

## ❌ ERRORES COMUNES Y SOLUCIONES

### Error: "Socket no inicializado"
**Causa**: Hook de notificaciones no se está ejecutando
**Solución**: 
1. Verificar que agregaste `useSellerNotifications()` en el layout
2. Verificar que estás logueado como SELLER

### Error: "Cannot play audio"
**Causa**: Archivos de sonido no existen
**Solución**: 
1. Verificar que la carpeta `public/sounds/` existe
2. Verificar que los archivos .mp3 están ahí
3. Intentar con archivos vacíos primero

### Error: "Item não encontrado"
**Causa**: El código de barras no coincide
**Solución**:
1. Verificar que el producto tenga código de barras en la BD
2. Verificar que estás digitando el código correcto
3. Revisar logs del backend para ver qué código se recibió

### Error: "WebSocket connection failed"
**Causa**: Backend no tiene WebSocket configurado o variable de entorno incorrecta
**Solución**:
1. Verificar `NEXT_PUBLIC_WS_URL` en `.env.local`
2. Verificar que el backend esté corriendo
3. Revisar logs del backend para ver errores de WebSocket

### Error: Migración de Prisma falla
**Causa**: Cambios en el schema no se pueden aplicar
**Solución**:
```bash
# Resetear BD (SOLO EN DESARROLLO)
cd apps/backend
pnpm prisma migrate reset
pnpm prisma migrate dev
pnpm prisma generate
```

---

## 🎯 RESULTADO FINAL

Al completar la Fase 2, tendrás un sistema completo de preparación de pedidos:

✅ Página de detalle con toda la información del pedido
✅ Sistema de escaneo de códigos de barras funcional
✅ Validación automática de productos
✅ Progreso en tiempo real
✅ Feedback visual y sonoro al escanear
✅ Botón de finalización cuando todos los items estén listos
✅ Notificaciones push en tiempo real vía WebSocket
✅ Sonidos diferenciados para cada tipo de evento
✅ Auto-actualización de datos cada 5-10 segundos
✅ Integración completa frontend-backend

---

## 🚀 PRÓXIMOS PASOS (OPCIONAL)

Después de completar la Fase 2, puedes agregar:

1. **Historial de ventas del vendedor**
   - Página `/vendedor/historico`
   - Filtros por fecha
   - Exportar a Excel/PDF

2. **Marcación manual de items**
   - Para casos donde el código de barras no funciona
   - Requiere justificación

3. **Items faltantes y sustituciones**
   - Reportar cuando un producto no está disponible
   - Sugerir sustitutos
   - Contactar al cliente

4. **Analytics del vendedor**
   - Tiempo promedio de picking
   - Items por hora
   - Tasa de precisión

---

## 📝 NOTAS FINALES

- Esta guía asume que completaste exitosamente la Fase 1
- Cada paso debe ejecutarse en orden
- Si un paso falla, NO continues al siguiente
- Prueba cada funcionalidad antes de continuar
- Los sonidos son opcionales pero mejoran mucho la UX
- Las notificaciones en tiempo real son la característica clave

¡Mucha suerte con la implementación! 🎉
