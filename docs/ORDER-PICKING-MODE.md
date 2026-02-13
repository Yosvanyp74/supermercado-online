# Modo Vendedor - Preparación de Pedidos (Order Picking)

## 🎯 Visión General

El modo vendedor tiene **DOS funciones principales**:

1. **Crear ventas nuevas (POS móvil)** - Ya documentado en SELLER-MODE-DETAILED.md
2. **Preparar pedidos online** - Sistema de picking para pedidos de clientes ← **NUEVA FUNCIONALIDAD**

Cuando un cliente realiza una compra a través de la app móvil o web, el vendedor debe:
- Recibir notificación del nuevo pedido
- Ver lista de productos a recoger
- Moverse por el almacén escaneando cada producto
- Marcar items como recogidos
- Completar el pedido cuando todos los items estén listos

## 🔔 Flujo Completo: De Compra Online a Pedido Listo

```
1. Cliente hace pedido desde app/web
   ↓
2. Backend crea Order con status: CONFIRMED
   ↓
3. Sistema notifica a vendedores disponibles
   ↓
4. Vendedor ve pedido en "Pedidos Pendentes"
   ↓
5. Vendedor acepta/toma el pedido (status: PROCESSING)
   ↓
6. App muestra lista de productos a recoger
   ↓
7. Vendedor camina por almacén escaneando items
   - Cada scan marca item como "recogido" ✓
   - Sistema valida que el producto sea correcto
   - Actualiza progreso en tiempo real
   ↓
8. Todos los items recogidos (100%)
   ↓
9. Vendedor marca pedido como "Listo" (status: READY_FOR_PICKUP o OUT_FOR_DELIVERY)
   ↓
10. Cliente recibe notificación
    ↓
11. Pedido pasa a delivery (si es para entrega) o espera cliente (si es pickup)
```

## 📱 Nuevas Pantallas del Modo Vendedor

### 1. OrderQueueScreen (Pedidos Pendentes)

**Propósito**: Lista de pedidos online esperando ser preparados.

**Layout**:
```
┌─────────────────────────────────┐
│ Pedidos Pendentes         [🔔3]│
├─────────────────────────────────┤
│ Filtros: [Todos▼] [Ordenar▼]   │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 🆕 NOVO #1234               │ │
│ │ Cliente: Maria Silva        │ │
│ │ 📦 5 items  •  R$ 89,50     │ │
│ │ ⏱️ Há 2 minutos             │ │
│ │ 🏠 Entrega                  │ │
│ │ [Aceitar Pedido]            │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ⏰ URGENTE #1233            │ │
│ │ Cliente: João Santos        │ │
│ │ 📦 12 items  •  R$ 156,80   │ │
│ │ ⏱️ Há 15 minutos            │ │
│ │ 🏪 Retirada                 │ │
│ │ [Aceitar Pedido]            │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ #1232                       │ │
│ │ Cliente: Ana Costa          │ │
│ │ 📦 3 items  •  R$ 45,20     │ │
│ │ ⏱️ Há 30 minutos            │ │
│ │ 🏠 Entrega                  │ │
│ │ [Aceitar Pedido]            │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Estados de pedidos**:
```typescript
enum OrderPickingStatus {
  PENDING = 'PENDING',           // Esperando ser tomado
  ASSIGNED = 'ASSIGNED',         // Asignado a vendedor
  PICKING = 'PICKING',           // En proceso de recolección
  PICKED = 'PICKED',             // Todos items recogidos
  READY = 'READY',               // Listo para entrega/pickup
  COMPLETED = 'COMPLETED',       // Completado
  CANCELLED = 'CANCELLED',       // Cancelado
}
```

**Notificación de nuevo pedido**:
```typescript
// WebSocket o Push Notification
socket.on('order:new', (order: Order) => {
  // Sonido de alerta
  playSound('new_order.mp3');
  
  // Vibración
  Vibration.vibrate([0, 100, 100, 100]);
  
  // Mostrar notificación local
  showNotification({
    title: 'Novo Pedido!',
    body: `#${order.orderNumber} - ${order.items.length} items`,
    data: { orderId: order.id },
  });
  
  // Actualizar badge
  updateBadgeCount();
  
  // Refrescar lista
  queryClient.invalidateQueries(['pending-orders']);
});
```

**Aceptar pedido**:
```typescript
const acceptOrder = async (orderId: string) => {
  try {
    // Asignar pedido al vendedor
    await api.post(`/seller/orders/${orderId}/accept`);
    
    // Actualizar estado local
    queryClient.invalidateQueries(['pending-orders']);
    queryClient.invalidateQueries(['my-orders']);
    
    // Navegar a pantalla de picking
    navigation.navigate('OrderPicking', { orderId });
    
    showToast('Pedido aceito!');
  } catch (error) {
    showError('Erro ao aceitar pedido');
  }
};
```

### 2. OrderPickingScreen (Preparação do Pedido)

**Propósito**: Pantalla principal para recoger productos del pedido.

**Layout**:
```
┌─────────────────────────────────┐
│ [← Voltar] Pedido #1234         │
│ Maria Silva  •  🏠 Entrega      │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ Progresso: 3/5 items (60%)  │ │
│ │ ████████████░░░░░░░░        │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ [📷 Escanear] [🔍 Busca Manual]│
├─────────────────────────────────┤
│ Lista de Produtos               │
│                                 │
│ ✅ RECOGIDO                     │
│ ┌─────────────────────────────┐ │
│ │ ✓ Pão Francês              │ │
│ │   Qty: 2  •  Cód: 12345    │ │
│ │   Localização: Padaria A2  │ │
│ │   ✓ Escaneado 12:30        │ │
│ └─────────────────────────────┘ │
│                                 │
│ ✅ RECOGIDO                     │
│ ┌─────────────────────────────┐ │
│ │ ✓ Leite Integral           │ │
│ │   Qty: 1  •  Cód: 67890    │ │
│ │   Localização: Lácteos B3  │ │
│ │   ✓ Escaneado 12:32        │ │
│ └─────────────────────────────┘ │
│                                 │
│ 📦 PENDENTE                     │
│ ┌─────────────────────────────┐ │
│ │ ⏺ Queijo Minas             │ │
│ │   Qty: 1  •  Cód: 11111    │ │
│ │   Localização: Lácteos B5  │ │
│ │   [Escanear]               │ │
│ └─────────────────────────────┘ │
│                                 │
│ 📦 PENDENTE                     │
│ ┌─────────────────────────────┐ │
│ │ ⏺ Arroz Integral 1kg       │ │
│ │   Qty: 2  •  Cód: 22222    │ │
│ │   Localização: Mercearia C1│ │
│ │   [Escanear]               │ │
│ └─────────────────────────────┘ │
│                                 │
│ 📦 PENDENTE                     │
│ ┌─────────────────────────────┐ │
│ │ ⏺ Feijão Preto 1kg         │ │
│ │   Qty: 1  •  Cód: 33333    │ │
│ │   Localização: Mercearia C2│ │
│ │   [Escanear]               │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ [Pausar]  [Finalizar Pedido]   │
└─────────────────────────────────┘
```

**Información del item**:
```typescript
interface PickingItem {
  id: string;
  orderItemId: string;
  product: Product;
  quantity: number;
  quantityPicked: number;
  status: 'PENDING' | 'PICKED' | 'MISSING';
  location?: string;          // Ubicación en almacén
  barcode: string;
  pickedAt?: Date;
  pickedBy?: string;          // ID del vendedor
  notes?: string;             // Ej: "No había stock"
}
```

**Datos del pedido**:
```typescript
interface OrderForPicking {
  id: string;
  orderNumber: string;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  deliveryMethod: 'HOME_DELIVERY' | 'STORE_PICKUP' | 'EXPRESS_DELIVERY';
  scheduledAt?: Date;
  items: PickingItem[];
  totalItems: number;
  pickedItems: number;
  progress: number;           // 0-100
  assignedTo?: string;        // ID del vendedor
  startedAt?: Date;
  estimatedTime: number;      // minutos estimados
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
}
```

### 3. BarcodeScannerScreen (Escaneo en Picking)

**Propósito**: Escanear productos durante la preparación del pedido.

**Layout (Modo Cámara)**:
```
┌─────────────────────────────────┐
│ [✕ Fechar] Escanear Produto     │
├─────────────────────────────────┤
│ Pedido #1234  •  3/5 items      │
├─────────────────────────────────┤
│                                 │
│     ┌───────────────────┐       │
│     │                   │       │
│     │   📷  CÁMARA      │       │
│     │                   │       │
│     │   [Área de scan]  │       │
│     │                   │       │
│     │   [ ][ ][ ][ ]    │       │
│     │                   │       │
│     └───────────────────┘       │
│                                 │
│  🎯 Próximo item:               │
│  Queijo Minas (Cód: 11111)      │
│  Localização: Lácteos B5        │
│                                 │
│  💡 Aponte para o código de     │
│     barras do produto           │
│                                 │
│  [🔦 Flash]  [🔍 Manual]        │
└─────────────────────────────────┘
```

**Lógica de escaneo en picking**:
```typescript
const onBarCodeScanned = async ({ data: barcode }: BarCode) => {
  // Haptic feedback
  Vibration.vibrate(50);
  
  // Buscar item en la lista del pedido
  const item = orderItems.find(i => i.barcode === barcode);
  
  if (!item) {
    // Producto no está en este pedido
    playSound('error.mp3');
    Vibration.vibrate([0, 100, 100, 100]);
    
    showAlert(
      'Produto Incorreto',
      'Este produto não está no pedido atual'
    );
    return;
  }
  
  if (item.status === 'PICKED') {
    // Ya fue recogido
    playSound('already_picked.mp3');
    
    showAlert(
      'Já Recogido',
      `${item.product.name} já foi escaneado`
    );
    return;
  }
  
  // Producto correcto - marcar como recogido
  try {
    await markItemAsPicked(item.id);
    
    // Sonido de éxito
    playSound('success.mp3');
    
    // Vibración de éxito
    Vibration.vibrate([0, 50, 50, 50]);
    
    // Actualizar UI
    updatePickedItem(item.id);
    
    // Mostrar feedback visual
    showSuccessAnimation(item.product.name);
    
    // Si era el último item, mostrar celebración
    if (isLastItem()) {
      showCompletionCelebration();
    }
    
    // Volver a pantalla de picking automáticamente
    setTimeout(() => {
      navigation.goBack();
    }, 1000);
    
  } catch (error) {
    playSound('error.mp3');
    showError('Erro ao marcar item');
  }
};
```

**Validaciones importantes**:
```typescript
const validatePickedItem = (
  scannedBarcode: string,
  expectedBarcode: string
): boolean => {
  // Validación estricta
  return scannedBarcode === expectedBarcode;
};

const handleWrongProduct = (
  scannedProduct: Product,
  expectedProduct: Product
) => {
  Alert.alert(
    'Produto Errado',
    `Você escaneou: ${scannedProduct.name}\n` +
    `Esperado: ${expectedProduct.name}\n\n` +
    `Confira o produto e tente novamente.`,
    [{ text: 'OK' }]
  );
};
```

### 4. ManualItemPickScreen

**Propósito**: Marcar item como recogido manualmente (sin escanear) en casos especiales.

**Casos de uso**:
- Producto sin código de barras
- Código de barras ilegible
- Producto a granel
- Emergencias

**Layout**:
```
┌─────────────────────────────────┐
│ [← Voltar] Confirmar Item       │
├─────────────────────────────────┤
│ ⚠️ Marcação Manual              │
│                                 │
│ Produto:                        │
│ ┌─────────────────────────────┐ │
│ │ 🧀 Queijo Minas             │ │
│ │ Código: 11111               │ │
│ │ Quantidade: 1               │ │
│ │ Localização: Lácteos B5     │ │
│ └─────────────────────────────┘ │
│                                 │
│ Motivo da marcação manual:      │
│ ┌─────────────────────────────┐ │
│ │ ○ Código de barras ilegível │ │
│ │ ○ Produto sem código        │ │
│ │ ○ Scanner não funciona      │ │
│ │ ● Outro (especificar)       │ │
│ └─────────────────────────────┘ │
│                                 │
│ Observações:                    │
│ ┌─────────────────────────────┐ │
│ │ Código de barras danificado │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│ ✓ Confirmo que peguei o         │
│   produto correto               │
│                                 │
├─────────────────────────────────┤
│ [Cancelar] [Confirmar]          │
└─────────────────────────────────┘
```

**Código**:
```typescript
const manuallyMarkItem = async (
  itemId: string,
  reason: string,
  notes?: string
) => {
  // Requiere confirmación explícita
  const confirmed = await confirmAction(
    'Confirmar Marcação Manual',
    'Você realmente pegou este produto?'
  );
  
  if (!confirmed) return;
  
  try {
    await api.post(`/seller/picking/items/${itemId}/mark-manual`, {
      reason,
      notes,
      timestamp: new Date(),
    });
    
    updatePickedItem(itemId);
    
    // Log para auditoría
    logAudit('MANUAL_PICK', {
      itemId,
      reason,
      notes,
      sellerId: currentUser.id,
    });
    
    showToast('Item marcado manualmente');
    navigation.goBack();
    
  } catch (error) {
    showError('Erro ao marcar item');
  }
};
```

### 5. OrderCompletionScreen

**Propósito**: Pantalla de confirmación cuando todos los items fueron recogidos.

**Layout**:
```
┌─────────────────────────────────┐
│          ✅                     │
│    TODOS OS ITEMS               │
│      RECOGIDOS!                 │
│                                 │
│ Pedido #1234                    │
│ Cliente: Maria Silva            │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ✓ 5/5 items recogidos       │ │
│ │ ⏱️ Tempo: 8 min 32 seg      │ │
│ │ 👤 Vendedor: João           │ │
│ └─────────────────────────────┘ │
│                                 │
│ Resumo:                         │
│ • Pão Francês (2x)       ✓     │
│ • Leite Integral (1x)    ✓     │
│ • Queijo Minas (1x)      ✓     │
│ • Arroz Integral (2x)    ✓     │
│ • Feijão Preto (1x)      ✓     │
│                                 │
│ Próximo passo:                  │
│ ┌─────────────────────────────┐ │
│ │ 🏠 Entrega a domicílio      │ │
│ │ Agendar: Hoje, 15:00        │ │
│ └─────────────────────────────┘ │
│                                 │
│ Ações:                          │
│ [📦 Embalar]  [📝 Obs]          │
│                                 │
├─────────────────────────────────┤
│ [Finalizar e Notificar Cliente] │
└─────────────────────────────────┘
```

**Código de finalización**:
```typescript
const completeOrderPicking = async (orderId: string) => {
  try {
    // Actualizar estado del pedido
    await api.post(`/seller/orders/${orderId}/complete-picking`);
    
    // Determinar próximo estado según método de entrega
    const nextStatus = order.deliveryMethod === 'STORE_PICKUP'
      ? 'READY_FOR_PICKUP'
      : 'READY_FOR_DELIVERY';
    
    await api.patch(`/orders/${orderId}/status`, {
      status: nextStatus,
    });
    
    // Notificar al cliente
    await sendCustomerNotification(order.customer.id, {
      title: 'Pedido Pronto!',
      body: order.deliveryMethod === 'STORE_PICKUP'
        ? 'Seu pedido está pronto para retirada'
        : 'Seu pedido está sendo preparado para entrega',
    });
    
    // Si es delivery, notificar a repartidores
    if (order.deliveryMethod === 'HOME_DELIVERY') {
      await notifyAvailableDrivers(orderId);
    }
    
    // Celebración
    showSuccessAnimation();
    playSound('order_complete.mp3');
    
    // Actualizar stats del vendedor
    updateSellerStats(orderId);
    
    showToast('Pedido finalizado com sucesso!');
    
    // Volver a lista de pedidos
    navigation.navigate('OrderQueue');
    
  } catch (error) {
    showError('Erro ao finalizar pedido');
  }
};
```

## 📊 Dashboard del Vendedor - Actualizado

Agregar sección de picking al `SellerHomeScreen`:

```
┌─────────────────────────────────┐
│  [👤 João Silva]  [🔔3]  [⚙️]  │
├─────────────────────────────────┤
│  📊 Resumo de Hoje              │
│  ┌─────────┬─────────┬────────┐ │
│  │ R$ 1.2k │  15     │ R$ 80  │ │
│  │ Vendas  │ Pedidos │ Ticket │ │
│  └─────────┴─────────┴────────┘ │
├─────────────────────────────────┤
│  📦 PEDIDOS ONLINE (3)          │
│  ┌─────────────────────────┐    │
│  │ 🆕 #1234  •  5 items    │    │
│  │ Maria Silva  •  Há 2min │    │
│  │ [Preparar →]            │    │
│  └─────────────────────────┘    │
│                                 │
│  [Ver Todos os Pedidos]         │
├─────────────────────────────────┤
│  🛒 EM PREPARAÇÃO               │
│  ┌─────────────────────────┐    │
│  │ #1233  •  8/12 items    │    │
│  │ João Santos             │    │
│  │ ████████░░░░░░ 67%      │    │
│  │ [Continuar →]           │    │
│  └─────────────────────────┘    │
├─────────────────────────────────┤
│  ┌──────────────────────────┐   │
│  │  ➕  NOVA VENDA          │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
```

## 🔔 Sistema de Notificaciones

### Notificación de Nuevo Pedido

**Push Notification**:
```typescript
const sendNewOrderNotification = async (order: Order) => {
  // Enviar a todos los vendedores disponibles
  const availableSellers = await getAvailableSellers();
  
  for (const seller of availableSellers) {
    await sendPushNotification(seller.id, {
      title: 'Novo Pedido! 🛒',
      body: `#${order.orderNumber} - ${order.items.length} items - R$ ${order.total}`,
      data: {
        type: 'NEW_ORDER',
        orderId: order.id,
        priority: calculatePriority(order),
      },
      sound: 'new_order.mp3',
      badge: getSellerPendingOrders(seller.id).length + 1,
    });
  }
};
```

**Cálculo de prioridad**:
```typescript
const calculatePriority = (order: Order): 'NORMAL' | 'HIGH' | 'URGENT' => {
  const now = new Date();
  const scheduledAt = order.scheduledAt;
  
  if (!scheduledAt) return 'NORMAL';
  
  const hoursUntilDelivery = 
    (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntilDelivery < 1) return 'URGENT';
  if (hoursUntilDelivery < 2) return 'HIGH';
  return 'NORMAL';
};
```

### Notificación al Cliente (Progreso)

Opcional: Notificar al cliente del progreso de preparación

```typescript
// Cuando se complete el 50%
if (progress === 50) {
  sendCustomerNotification(order.customer.id, {
    title: 'Pedido em Andamento',
    body: 'Seu pedido está sendo preparado! 50% completo.',
  });
}

// Cuando se complete el 100%
if (progress === 100) {
  sendCustomerNotification(order.customer.id, {
    title: 'Pedido Pronto! ✅',
    body: order.deliveryMethod === 'STORE_PICKUP'
      ? 'Seu pedido está pronto para retirada'
      : 'Seu pedido será entregue em breve',
  });
}
```

## 🎯 Características Especiales

### 1. Sugerencia de Ruta Óptima

**Ordenar items por ubicación en almacén** para minimizar el recorrido:

```typescript
const optimizePickingRoute = (items: PickingItem[]): PickingItem[] => {
  // Definir zonas del almacén
  const zones = {
    A: ['A1', 'A2', 'A3'],  // Panadería
    B: ['B1', 'B2', 'B3', 'B4', 'B5'],  // Lácteos
    C: ['C1', 'C2', 'C3'],  // Mercearia
    D: ['D1', 'D2'],  // Carnes
    E: ['E1', 'E2', 'E3'],  // Frutas/Verduras
  };
  
  // Ordenar items por zona
  return items.sort((a, b) => {
    const zoneA = getZone(a.location);
    const zoneB = getZone(b.location);
    
    if (zoneA !== zoneB) {
      return zoneA.localeCompare(zoneB);
    }
    
    // Dentro de la misma zona, ordenar por ubicación específica
    return a.location.localeCompare(b.location);
  });
};
```

**UI de ruta sugerida**:
```
┌─────────────────────────────────┐
│ 🗺️ Ruta Sugerida               │
├─────────────────────────────────┤
│ 1️⃣ Zona A - Padaria            │
│    • Pão Francês (A2)           │
│    ↓                            │
│ 2️⃣ Zona B - Lácteos            │
│    • Leite Integral (B3)        │
│    • Queijo Minas (B5)          │
│    ↓                            │
│ 3️⃣ Zona C - Mercearia          │
│    • Arroz Integral (C1)        │
│    • Feijão Preto (C2)          │
└─────────────────────────────────┘
```

### 2. Modo "Manos Libres"

Usar comandos de voz para confirmar items (opcional):

```typescript
// react-native-voice
import Voice from '@react-native-voice/voice';

const enableVoiceMode = () => {
  Voice.onSpeechResults = (e) => {
    const command = e.value[0].toLowerCase();
    
    // Comandos reconocidos
    if (command.includes('confirmar') || command.includes('ok')) {
      confirmCurrentItem();
    } else if (command.includes('pular') || command.includes('próximo')) {
      skipCurrentItem();
    } else if (command.includes('ajuda')) {
      showHelp();
    }
  };
  
  Voice.start('pt-BR');
};
```

### 3. Items Faltantes

Qué hacer cuando un producto no está disponible:

```
┌─────────────────────────────────┐
│ ⚠️ Produto Não Disponível       │
├─────────────────────────────────┤
│ Queijo Minas (Cód: 11111)       │
│ Quantidade solicitada: 1        │
│                                 │
│ O que fazer?                    │
│ ┌─────────────────────────────┐ │
│ │ ○ Substituir produto        │ │
│ │ ○ Remover do pedido         │ │
│ │ ○ Contactar cliente         │ │
│ │ ○ Marcar para reabastecer   │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Cancelar]  [Confirmar]         │
└─────────────────────────────────┘
```

**Código**:
```typescript
const handleMissingItem = async (
  item: PickingItem,
  action: 'SUBSTITUTE' | 'REMOVE' | 'CONTACT' | 'RESTOCK'
) => {
  switch (action) {
    case 'SUBSTITUTE':
      // Mostrar productos similares
      navigation.navigate('ProductSubstitute', { 
        originalProduct: item.product 
      });
      break;
      
    case 'REMOVE':
      // Remover del pedido y ajustar total
      await removeItemFromOrder(item.id);
      await recalculateOrderTotal(item.orderId);
      break;
      
    case 'CONTACT':
      // Iniciar llamada o WhatsApp con cliente
      contactCustomer(item.order.customer);
      break;
      
    case 'RESTOCK':
      // Crear alerta de reabastecimiento
      await createRestockAlert(item.product.id);
      break;
  }
  
  // Marcar item como "missing"
  await updateItemStatus(item.id, 'MISSING');
};
```

### 4. Sustitución de Productos

```
┌─────────────────────────────────┐
│ Substituir Produto              │
├─────────────────────────────────┤
│ Original:                       │
│ 🧀 Queijo Minas - R$ 12,00      │
│                                 │
│ Sugestões similares:            │
│ ┌─────────────────────────────┐ │
│ │ ○ Queijo Prato              │ │
│ │   R$ 11,50 (-R$ 0,50)       │ │
│ ├─────────────────────────────┤ │
│ │ ○ Queijo Mussarela          │ │
│ │   R$ 13,00 (+R$ 1,00)       │ │
│ ├─────────────────────────────┤ │
│ │ ○ Queijo Coalho             │ │
│ │   R$ 14,50 (+R$ 2,50)       │ │
│ └─────────────────────────────┘ │
│                                 │
│ ⚠️ Cliente será notificado      │
│    da substituição              │
│                                 │
│ [Cancelar]  [Confirmar]         │
└─────────────────────────────────┘
```

## 📈 Analytics de Picking

### Métricas del Vendedor

```typescript
interface PickingMetrics {
  // Eficiencia
  averagePickingTime: number;    // minutos por pedido
  itemsPerHour: number;
  accuracyRate: number;          // % de items correctos
  
  // Productividad
  ordersCompleted: number;
  totalItemsPicked: number;
  
  // Calidad
  manualPickRate: number;        // % marcados manualmente
  substitutionRate: number;      // % con sustituciones
  missingItemRate: number;       // % items faltantes
  
  // Tiempo
  fastestOrder: number;          // segundos
  slowestOrder: number;
}
```

**Gamificación**:
```
┌─────────────────────────────────┐
│ 🏆 Suas Conquistas              │
├─────────────────────────────────┤
│ ⚡ Picking Rápido               │
│    50 pedidos < 10 min          │
│    ████████████████░░ 90%       │
│                                 │
│ 🎯 100% Preciso                 │
│    100 items sem erro           │
│    ███████████████░░ 84%        │
│                                 │
│ 🌟 Mestre do Picking            │
│    500 pedidos completados      │
│    █████████░░░░░░░░ 340/500    │
└─────────────────────────────────┘
```

## 🔌 Endpoints del Backend

### Nuevos endpoints para picking:

```typescript
// Obtener pedidos pendientes
GET /api/seller/orders/pending
Response: Order[]

// Aceptar pedido
POST /api/seller/orders/:id/accept
Response: { success: boolean, order: Order }

// Obtener detalle de pedido para picking
GET /api/seller/orders/:id/picking
Response: OrderForPicking

// Marcar item como recogido
POST /api/seller/picking/items/:id/pick
Body: { barcode: string, timestamp: Date }
Response: { success: boolean, item: PickingItem }

// Marcar item manualmente
POST /api/seller/picking/items/:id/mark-manual
Body: { reason: string, notes?: string }
Response: { success: boolean }

// Reportar item faltante
POST /api/seller/picking/items/:id/missing
Body: { action: string, substitution?: Product }
Response: { success: boolean }

// Completar picking
POST /api/seller/orders/:id/complete-picking
Response: { success: boolean, nextStatus: OrderStatus }

// Obtener pedidos en proceso
GET /api/seller/orders/in-progress
Response: Order[]

// Pausar picking
POST /api/seller/orders/:id/pause
Response: { success: boolean }

// Estadísticas de picking del vendedor
GET /api/seller/picking/stats
Response: PickingMetrics
```

## 🎯 Flujo de Estados del Pedido

```typescript
// Estados del pedido desde la perspectiva del vendedor
enum OrderStatus {
  CONFIRMED = 'CONFIRMED',           // Nuevo, esperando ser tomado
  ASSIGNED = 'ASSIGNED',             // Asignado a vendedor
  PICKING = 'PICKING',               // En proceso de recolección
  PICKED = 'PICKED',                 // Todos items recogidos
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',   // Listo para retirar
  READY_FOR_DELIVERY = 'READY_FOR_DELIVERY', // Listo para entregar
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',    // En camino
  DELIVERED = 'DELIVERED',           // Entregado
  CANCELLED = 'CANCELLED',           // Cancelado
}
```

**Transiciones**:
```
CONFIRMED → ASSIGNED (vendedor acepta)
    ↓
ASSIGNED → PICKING (vendedor inicia picking)
    ↓
PICKING → PICKED (todos items escaneados)
    ↓
PICKED → READY_FOR_PICKUP (si es pickup)
    ↓
PICKED → READY_FOR_DELIVERY (si es delivery)
    ↓
READY_FOR_DELIVERY → OUT_FOR_DELIVERY (repartidor acepta)
    ↓
OUT_FOR_DELIVERY → DELIVERED (entrega completada)
```

## ✅ Checklist de Implementación

- [ ] OrderQueueScreen con lista de pedidos pendientes
- [ ] Sistema de notificaciones (WebSocket + Push)
- [ ] Aceptar/rechazar pedidos
- [ ] OrderPickingScreen con lista de items
- [ ] Ordenamiento por ubicación (ruta óptima)
- [ ] BarcodeScannerScreen integrado con picking
- [ ] Validación de producto correcto al escanear
- [ ] Feedback visual/sonoro al escanear
- [ ] Barra de progreso en tiempo real
- [ ] Marcación manual de items (con justificación)
- [ ] Manejo de items faltantes
- [ ] Sistema de sustitución de productos
- [ ] OrderCompletionScreen
- [ ] Notificación al cliente (pedido listo)
- [ ] Asignación a delivery (si aplica)
- [ ] Pausar/reanudar picking
- [ ] Múltiples vendedores trabajando simultáneamente
- [ ] Analytics de picking
- [ ] Gamificación/achievements
- [ ] Modo offline (guardar progreso)
- [ ] Sincronización de estado en tiempo real
- [ ] Tests E2E del flujo completo

## 📱 Navegación Actualizada

```typescript
type SellerNavigatorParamList = {
  SellerHome: undefined;
  
  // POS Móvil (ya existente)
  ProductScanner: undefined;
  ActiveSale: undefined;
  CustomerSearch: undefined;
  Payment: { saleId: string };
  SalesHistory: undefined;
  
  // Picking de Pedidos (NUEVO)
  OrderQueue: undefined;
  OrderPicking: { orderId: string };
  BarcodeScannerPicking: { orderId: string, currentItemId: string };
  ManualItemPick: { itemId: string };
  ProductSubstitute: { itemId: string, originalProduct: Product };
  OrderCompletion: { orderId: string };
};
```

## 🎉 Resumen

Con esta funcionalidad, el **Modo Vendedor** ahora es una solución completa que cubre:

1. ✅ **Ventas presenciales** (POS móvil) - Ya documentado
2. ✅ **Preparación de pedidos online** (Picking) - Nuevo
3. ✅ **Gestión de inventario en tiempo real**
4. ✅ **Comunicación con clientes**
5. ✅ **Coordinación con delivery**
6. ✅ **Analytics y métricas**

Esto convierte tu app en una **herramienta integral** para las operaciones del supermercado, maximizando la eficiencia y reduciendo errores. 🚀
