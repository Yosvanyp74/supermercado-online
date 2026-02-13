# Modo Vendedor (POS Móvil) - Especificación Detallada

## 🎯 Visión General

El **Modo Vendedor** transforma la aplicación móvil en un sistema de Punto de Venta (POS) completo y móvil, permitiendo a los vendedores realizar ventas mientras se mueven libremente por el almacén o piso de ventas.

## 🎨 Diseño de UI/UX

### Principios de Diseño
1. **Velocidad primero**: Minimizar taps y tiempo entre acciones
2. **Una mano**: Diseñado para usarse con una sola mano
3. **Botones grandes**: Fácil de tocar incluso con guantes
4. **Feedback claro**: Visual y sonoro para cada acción
5. **Modo retrato**: Optimizado para uso vertical (más cómodo al caminar)

### Paleta de Colores Sugerida
```typescript
const SELLER_THEME = {
  primary: '#10b981',      // Verde - Acciones positivas
  secondary: '#3b82f6',    // Azul - Información
  danger: '#ef4444',       // Rojo - Eliminar/Cancelar
  warning: '#f59e0b',      // Amarillo - Alertas
  success: '#22c55e',      // Verde claro - Éxito
  background: '#ffffff',   // Blanco - Fondo
  card: '#f9fafb',        // Gris muy claro - Cards
  text: '#111827',        // Negro - Texto principal
  textLight: '#6b7280',   // Gris - Texto secundario
};
```

## 📱 Pantallas Detalladas

### 1. SellerHomeScreen

**Propósito**: Dashboard principal del vendedor con acceso rápido a todas las funciones.

**Componentes**:

```typescript
interface SellerHomeScreenState {
  stats: {
    todaySales: number;
    todayOrders: number;
    averageTicket: number;
    itemsSold: number;
    goalProgress: number; // 0-100
  };
  activeSale: Sale | null;
  recentSales: Sale[];
  isOnline: boolean;
}
```

**Layout**:
```
┌─────────────────────────────────┐
│  [👤 João Silva]  [🔔]  [⚙️]   │ ← Header
├─────────────────────────────────┤
│  📊 Vendas de Hoje              │
│  ┌─────────┬─────────┬────────┐ │
│  │ R$ 1.2k │  15     │ R$ 80  │ │
│  │ Total   │ Vendas  │ Ticket │ │
│  └─────────┴─────────┴────────┘ │
│                                 │
│  Meta do Dia: ████████░░ 85%   │
├─────────────────────────────────┤
│  🛒 VENDA ATIVA                 │  ← Se mostra se hay
│  ┌─────────────────────────┐    │     venta en progreso
│  │ Cliente: Maria Silva    │    │
│  │ 3 items - R$ 45,60      │    │
│  │ [Continuar →]           │    │
│  └─────────────────────────┘    │
├─────────────────────────────────┤
│  ┌──────────────────────────┐   │
│  │  ➕  NOVA VENDA          │   │ ← Botón principal
│  └──────────────────────────┘   │
├─────────────────────────────────┤
│  Vendas Recentes               │
│  ┌──────────────────────────┐  │
│  │ #1234  R$ 23,40   12:30  │  │
│  │ #1233  R$ 56,80   12:15  │  │
│  │ #1232  R$ 89,00   12:00  │  │
│  └──────────────────────────┘  │
│  [Ver Todas →]                 │
└─────────────────────────────────┘
```

**Interacciones**:
- Tap "Nova Venda" → ProductScannerScreen
- Tap "Continuar" en venda ativa → ActiveSaleScreen
- Tap venda recente → Detalle de venta
- Swipe down to refresh stats

### 2. ProductScannerScreen

**Propósito**: Buscar y agregar productos a la venta mediante escaneo de código de barras o búsqueda manual.

**Modos de operación**:
1. **Escaneo continuo**: Escanea múltiples productos sin cerrar cámara
2. **Búsqueda manual**: Input de texto con autocompletado
3. **Productos frecuentes**: Grid de acceso rápido

**Componentes**:
```typescript
interface ProductScannerState {
  scanMode: 'camera' | 'manual';
  searchQuery: string;
  searchResults: Product[];
  frequentProducts: Product[];
  recentProducts: Product[];
  currentSale: Sale;
}
```

**Layout (Modo Cámara)**:
```
┌─────────────────────────────────┐
│ [← Voltar]  Escanear  [Manual] │
├─────────────────────────────────┤
│                                 │
│     ┌───────────────────┐       │
│     │                   │       │
│     │   📷  CÁMARA      │       │
│     │                   │       │
│     │   [Área de scan]  │       │
│     │                   │       │
│     └───────────────────┘       │
│                                 │
│  Aponte para o código de barras│
│                                 │
│  💡 Dica: Mantenha a câmera    │
│     estável para melhor leitura│
├─────────────────────────────────┤
│  🛒 Carrinho: 3 items           │
│  [Ver Carrinho →]               │
└─────────────────────────────────┘
```

**Layout (Modo Manual)**:
```
┌─────────────────────────────────┐
│ [← Voltar]  Manual  [📷 Scan]  │
├─────────────────────────────────┤
│  🔍 [Buscar produto...]         │
├─────────────────────────────────┤
│  Produtos Frequentes            │
│  ┌────┬────┬────┬────┐          │
│  │🍞  │🥛  │🧀  │🍖  │          │
│  │Pão │Leite│Queijo│Carne│      │
│  │R$6 │R$4 │R$12│R$25│          │
│  └────┴────┴────┴────┘          │
│                                 │
│  Resultados da Busca            │
│  ┌─────────────────────────┐    │
│  │ 🍞 Pão Francês          │    │
│  │    R$ 6,00  |  [+]      │    │
│  ├─────────────────────────┤    │
│  │ 🥖 Pão Integral         │    │
│  │    R$ 8,50  |  [+]      │    │
│  └─────────────────────────┘    │
├─────────────────────────────────┤
│  🛒 Carrinho: 3 items           │
│  [Ver Carrinho →]               │
└─────────────────────────────────┘
```

**Funcionalidades**:

**Escaneo de código de barras**:
```typescript
import { RNCamera } from 'react-native-camera';

const onBarCodeRead = async ({ data, type }: BarCode) => {
  // Haptic feedback
  Vibration.vibrate(100);
  
  // Buscar producto
  const product = await searchProductByBarcode(data);
  
  if (product) {
    // Sonido de éxito
    playSound('beep_success');
    
    // Agregar a venta
    addToActiveSale(product, 1);
    
    // Mostrar toast
    showToast(`${product.name} adicionado!`);
  } else {
    // Sonido de error
    playSound('beep_error');
    
    // Mostrar error
    showAlert('Produto não encontrado', `Código: ${data}`);
  }
};
```

**Búsqueda con autocompletado**:
```typescript
const useProductSearch = () => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  
  const { data: results } = useQuery({
    queryKey: ['products', 'search', debouncedQuery],
    queryFn: () => searchProducts(debouncedQuery),
    enabled: debouncedQuery.length > 2,
  });
  
  return { query, setQuery, results };
};
```

**Productos frecuentes**:
```typescript
// Basado en historial del vendedor
const { data: frequentProducts } = useQuery({
  queryKey: ['seller', 'frequent-products'],
  queryFn: getSellerFrequentProducts,
  staleTime: 60 * 60 * 1000, // 1 hora
});
```

### 3. ActiveSaleScreen

**Propósito**: Gestionar la venta en progreso - agregar items, modificar cantidades, aplicar descuentos.

**Componentes**:
```typescript
interface Sale {
  id: string;
  localId: string; // Para modo offline
  items: SaleItem[];
  customer?: Customer;
  subtotal: number;
  discount: number;
  discountReason?: string;
  tax: number;
  total: number;
  notes?: string;
  status: 'DRAFT' | 'PAYMENT_PENDING' | 'COMPLETED' | 'SUSPENDED';
  createdAt: Date;
  updatedAt: Date;
}

interface SaleItem {
  id: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  discountReason?: string;
  subtotal: number;
  total: number;
}
```

**Layout**:
```
┌─────────────────────────────────┐
│ [← Voltar]  Venda #L1234        │
├─────────────────────────────────┤
│  👤 Cliente                     │
│  ┌─────────────────────────┐    │
│  │ Maria Silva             │    │
│  │ 📞 (51) 99999-9999      │    │
│  │ [Alterar]               │    │
│  └─────────────────────────┘    │
│  [ou: Buscar Cliente...]        │
├─────────────────────────────────┤
│  Items da Venda                 │
│  ┌─────────────────────────┐    │
│  │ 🍞 Pão Francês          │    │
│  │ R$ 6,00 x 2             │    │
│  │ ┌─┐  2  ┌─┐  🗑️  R$12  │    │
│  │ │-│     │+│            │    │
│  │ └─┘     └─┘            │    │
│  ├─────────────────────────┤    │
│  │ 🥛 Leite Integral       │    │
│  │ R$ 4,50 x 1             │    │
│  │ ┌─┐  1  ┌─┐  🗑️  R$4,50│    │
│  │ │-│     │+│            │    │
│  │ └─┘     └─┘            │    │
│  └─────────────────────────┘    │
│                                 │
│  [➕ Adicionar Produtos]        │
├─────────────────────────────────┤
│  💰 Resumo                      │
│  Subtotal:          R$  16,50   │
│  Desconto:          R$   0,00   │
│  [Aplicar Desconto]             │
│  Taxa (IVA):        R$   2,64   │
│  ════════════════════════════   │
│  TOTAL:             R$  19,14   │
├─────────────────────────────────┤
│  [⏸️ Suspender]  [💳 Pagar]     │
└─────────────────────────────────┘
```

**Interacciones**:

**Modificar cantidad**:
```typescript
const updateQuantity = (itemId: string, delta: number) => {
  setActiveSale(sale => ({
    ...sale,
    items: sale.items.map(item =>
      item.id === itemId
        ? {
            ...item,
            quantity: Math.max(1, item.quantity + delta),
            total: (item.quantity + delta) * item.unitPrice,
          }
        : item
    ),
  }));
  
  recalculateTotals();
};
```

**Aplicar descuento**:
```typescript
const applyDiscount = async (
  type: 'item' | 'sale',
  amount: number,
  reason: string,
  itemId?: string
) => {
  // Verificar permiso
  const canApplyDiscount = await checkPermission('seller:apply_discount');
  const isLargeDiscount = amount > 20; // Más de 20%
  
  if (isLargeDiscount) {
    const canApplyLarge = await checkPermission('seller:apply_large_discount');
    if (!canApplyLarge) {
      // Solicitar autorización de gerente
      const authorized = await requestManagerAuth();
      if (!authorized) return;
    }
  }
  
  if (type === 'item') {
    updateItemDiscount(itemId!, amount, reason);
  } else {
    updateSaleDiscount(amount, reason);
  }
};
```

**Suspender venta**:
```typescript
const suspendSale = async () => {
  try {
    // Guardar localmente primero
    await saveSaleLocally(activeSale);
    
    // Si hay conexión, sincronizar
    if (isOnline) {
      await api.post('/seller/sales/suspend', activeSale);
    }
    
    showToast('Venda suspensa com sucesso');
    navigation.navigate('SellerHome');
  } catch (error) {
    showError('Erro ao suspender venda');
  }
};
```

### 4. CustomerSearchScreen

**Propósito**: Buscar cliente existente o crear uno nuevo para vincular a la venta.

**Layout**:
```
┌─────────────────────────────────┐
│ [← Voltar]  Buscar Cliente      │
├─────────────────────────────────┤
│  🔍 [Nome, telefone, email...]  │
├─────────────────────────────────┤
│  Clientes Frequentes            │
│  ┌─────────────────────────┐    │
│  │ 👤 Maria Silva          │    │
│  │    (51) 99999-9999      │    │
│  │    [Selecionar]         │    │
│  ├─────────────────────────┤    │
│  │ 👤 João Santos          │    │
│  │    (51) 98888-8888      │    │
│  │    [Selecionar]         │    │
│  └─────────────────────────┘    │
│                                 │
│  Resultados (3)                 │
│  ┌─────────────────────────┐    │
│  │ 👤 Ana Costa            │    │
│  │    ana@email.com        │    │
│  │    📊 15 compras        │    │
│  │    [Selecionar]         │    │
│  └─────────────────────────┘    │
├─────────────────────────────────┤
│  [➕ Novo Cliente]              │
│  [🤷 Venda Anônima]             │
└─────────────────────────────────┘
```

**Crear cliente rápido**:
```
┌─────────────────────────────────┐
│ [← Voltar]  Novo Cliente        │
├─────────────────────────────────┤
│  Nome Completo *                │
│  [________________]              │
│                                 │
│  Telefone *                     │
│  [________________]              │
│                                 │
│  Email (opcional)               │
│  [________________]              │
│                                 │
│  CPF (opcional)                 │
│  [________________]              │
│                                 │
│  ⚠️ Campos com * são obrigatórios│
├─────────────────────────────────┤
│  [Cancelar]  [Criar Cliente]    │
└─────────────────────────────────┘
```

**Código**:
```typescript
const createQuickCustomer = async (data: QuickCustomerForm) => {
  const customer = await api.post('/seller/customers/quick', {
    name: data.name,
    phone: formatPhone(data.phone),
    email: data.email || null,
    cpf: data.cpf ? formatCPF(data.cpf) : null,
  });
  
  // Vincular a venta actual
  linkCustomerToSale(customer);
  
  showToast(`Cliente ${customer.name} criado!`);
  navigation.goBack();
};
```

### 5. PaymentScreen

**Propósito**: Procesar el pago de la venta.

**Métodos de pago soportados**:
1. Dinheiro (Efectivo)
2. Cartão de Débito
3. Cartão de Crédito
4. PIX
5. Transferência

**Layout - Selección de método**:
```
┌─────────────────────────────────┐
│ [← Voltar]  Pagamento           │
├─────────────────────────────────┤
│  Total a Pagar                  │
│  ┌─────────────────────────┐    │
│  │   R$ 19,14              │    │
│  └─────────────────────────┘    │
├─────────────────────────────────┤
│  Método de Pagamento            │
│  ┌─────────────────────────┐    │
│  │ 💵 Dinheiro             │    │
│  │ [Selecionar]            │    │
│  ├─────────────────────────┤    │
│  │ 💳 Cartão Débito        │    │
│  │ [Selecionar]            │    │
│  ├─────────────────────────┤    │
│  │ 💳 Cartão Crédito       │    │
│  │ [Selecionar]            │    │
│  ├─────────────────────────┤    │
│  │ 📱 PIX                  │    │
│  │ [Selecionar]            │    │
│  ├─────────────────────────┤    │
│  │ 🏦 Transferência        │    │
│  │ [Selecionar]            │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

**Layout - Pago en efectivo**:
```
┌─────────────────────────────────┐
│ [← Método]  Dinheiro            │
├─────────────────────────────────┤
│  Total a Pagar: R$ 19,14        │
├─────────────────────────────────┤
│  Valor Recebido                 │
│  ┌─────────────────────────┐    │
│  │ R$  [20,00]             │    │
│  └─────────────────────────┘    │
│                                 │
│  Teclado Numérico               │
│  ┌───────────────────────┐      │
│  │  [7]  [8]  [9]        │      │
│  │  [4]  [5]  [6]        │      │
│  │  [1]  [2]  [3]        │      │
│  │  [00] [0]  [,]        │      │
│  │  [C]  [⌫]             │      │
│  └───────────────────────┘      │
│                                 │
│  ✅ Troco: R$ 0,86              │
├─────────────────────────────────┤
│  [← Voltar]  [Confirmar]        │
└─────────────────────────────────┘
```

**Código - Cálculo de cambio**:
```typescript
const CashPayment = ({ total }: { total: number }) => {
  const [received, setReceived] = useState('');
  
  const receivedAmount = parseFloat(received) || 0;
  const change = receivedAmount - total;
  const isValid = receivedAmount >= total;
  
  return (
    <View>
      <NumericKeypad
        value={received}
        onChange={setReceived}
        maxDecimals={2}
      />
      
      {isValid && (
        <ChangeDisplay amount={change} />
      )}
      
      <Button
        disabled={!isValid}
        onPress={() => confirmPayment('CASH', receivedAmount, change)}
      >
        Confirmar Pagamento
      </Button>
    </View>
  );
};
```

**Layout - PIX**:
```
┌─────────────────────────────────┐
│ [← Método]  PIX                 │
├─────────────────────────────────┤
│  Total a Pagar: R$ 19,14        │
├─────────────────────────────────┤
│  QR Code PIX                    │
│  ┌─────────────────────────┐    │
│  │                         │    │
│  │   ████████████████      │    │
│  │   ██  ██    ██  ██      │    │
│  │   ██████  ████████      │    │
│  │   ██  ██    ██  ██      │    │
│  │   ████████████████      │    │
│  │                         │    │
│  └─────────────────────────┘    │
│                                 │
│  Aguardando pagamento...        │
│  [⏱️ 5:00]                      │
│                                 │
│  Chave PIX: pix@loja.com        │
│  [📋 Copiar]                    │
├─────────────────────────────────┤
│  [Cancelar]                     │
└─────────────────────────────────┘
```

**Código - Confirmación de pago**:
```typescript
const confirmPayment = async (
  method: PaymentMethod,
  amount: number,
  change?: number
) => {
  try {
    // Mostrar loading
    setLoading(true);
    
    // Crear venta en backend
    const order = await api.post('/seller/sales', {
      items: activeSale.items,
      customerId: activeSale.customer?.id,
      discount: activeSale.discount,
      paymentMethod: method,
      paymentAmount: amount,
      change,
    });
    
    // Actualizar inventario localmente
    updateLocalInventory(activeSale.items);
    
    // Limpiar venta activa
    clearActiveSale();
    
    // Mostrar pantalla de éxito
    navigation.navigate('PaymentSuccess', { order });
    
  } catch (error) {
    if (!isOnline) {
      // Guardar offline para sincronizar después
      await saveSaleOffline(activeSale);
      showToast('Venda salva offline');
      navigation.navigate('SellerHome');
    } else {
      showError('Erro ao processar pagamento');
    }
  } finally {
    setLoading(false);
  }
};
```

### 6. PaymentSuccessScreen

**Layout**:
```
┌─────────────────────────────────┐
│                                 │
│          ✅                     │
│     VENDA CONCLUÍDA!            │
│                                 │
│  Pedido #1234                   │
│  R$ 19,14                       │
│                                 │
│  Cliente: Maria Silva           │
│  Método: Dinheiro               │
│  Troco: R$ 0,86                 │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 📧 Enviar por Email     │    │
│  ├─────────────────────────┤    │
│  │ 💬 Enviar por WhatsApp  │    │
│  ├─────────────────────────┤    │
│  │ 🖨️ Imprimir            │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌──────────────────────────┐   │
│  │  ➕ NOVA VENDA           │   │
│  └──────────────────────────┘   │
│                                 │
│  [Ver Detalhes]  [Voltar]      │
└─────────────────────────────────┘
```

### 7. SalesHistoryScreen

**Layout**:
```
┌─────────────────────────────────┐
│ [← Voltar]  Histórico           │
├─────────────────────────────────┤
│  📅 [Hoje ▼]  🔍 [Buscar]       │
├─────────────────────────────────┤
│  Resumo do Dia                  │
│  15 vendas  •  R$ 1.234,50      │
├─────────────────────────────────┤
│  ┌─────────────────────────┐    │
│  │ #1234  12:30  R$ 19,14  │    │
│  │ Maria Silva             │    │
│  │ 💵 Dinheiro  ✅         │    │
│  │ [Ver Detalhes]          │    │
│  ├─────────────────────────┤    │
│  │ #1233  12:15  R$ 56,80  │    │
│  │ João Santos             │    │
│  │ 💳 Cartão  ✅           │    │
│  │ [Ver Detalhes]          │    │
│  ├─────────────────────────┤    │
│  │ #1232  12:00  R$ 89,00  │    │
│  │ Anônimo                 │    │
│  │ 📱 PIX  ✅              │    │
│  │ [Ver Detalhes]          │    │
│  └─────────────────────────┘    │
│                                 │
│  [Carregar Mais]                │
└─────────────────────────────────┘
```

**Filtros disponibles**:
```typescript
interface SalesFilters {
  dateRange: {
    from: Date;
    to: Date;
  };
  paymentMethod?: PaymentMethod;
  customer?: string;
  minAmount?: number;
  maxAmount?: number;
  status?: 'COMPLETED' | 'REFUNDED' | 'CANCELLED';
}
```

## 🔔 Notificaciones y Alertas

### Sonidos
```typescript
const SOUNDS = {
  SCAN_SUCCESS: 'beep_success.mp3',
  SCAN_ERROR: 'beep_error.mp3',
  PAYMENT_COMPLETE: 'cash_register.mp3',
  LOW_STOCK: 'alert.mp3',
};

// Usar react-native-sound
import Sound from 'react-native-sound';

const playSound = (soundName: keyof typeof SOUNDS) => {
  const sound = new Sound(SOUNDS[soundName], Sound.MAIN_BUNDLE, (error) => {
    if (!error) {
      sound.play();
    }
  });
};
```

### Vibraciones
```typescript
import { Vibration } from 'react-native';

// Feedback al escanear
Vibration.vibrate(100);

// Feedback de error
Vibration.vibrate([0, 100, 100, 100]);

// Feedback de éxito
Vibration.vibrate([0, 50, 50, 50]);
```

### Alertas de Stock Bajo
```typescript
const checkStockAndAlert = (product: Product, quantity: number) => {
  const newStock = product.stock - quantity;
  
  if (newStock <= product.minStock) {
    showAlert(
      'Estoque Baixo',
      `${product.name} está com estoque baixo (${newStock} unidades)`
    );
    
    playSound('LOW_STOCK');
  }
  
  if (newStock < quantity) {
    showAlert(
      'Estoque Insuficiente',
      `Apenas ${product.stock} unidades disponíveis`
    );
    return false;
  }
  
  return true;
};
```

## 💾 Persistencia y Modo Offline

### AsyncStorage Structure
```typescript
const STORAGE_KEYS = {
  ACTIVE_SALE: '@seller/active_sale',
  PENDING_SALES: '@seller/pending_sales',
  SUSPENDED_SALES: '@seller/suspended_sales',
  FREQUENT_PRODUCTS: '@seller/frequent_products',
  OFFLINE_CUSTOMERS: '@seller/offline_customers',
  SETTINGS: '@seller/settings',
};
```

### Auto-save de Venta Activa
```typescript
// Guardar automáticamente cada cambio
useEffect(() => {
  const saveActiveSale = async () => {
    if (activeSale) {
      await AsyncStorage.setItem(
        STORAGE_KEYS.ACTIVE_SALE,
        JSON.stringify(activeSale)
      );
    }
  };
  
  saveActiveSale();
}, [activeSale]);

// Recuperar al iniciar app
useEffect(() => {
  const loadActiveSale = async () => {
    const saved = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_SALE);
    if (saved) {
      setActiveSale(JSON.parse(saved));
    }
  };
  
  loadActiveSale();
}, []);
```

### Sincronización de Ventas Offline
```typescript
const syncOfflineSales = async () => {
  const pending = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_SALES);
  if (!pending) return;
  
  const sales: Sale[] = JSON.parse(pending);
  const unsynced = sales.filter(s => !s.synced);
  
  for (const sale of unsynced) {
    try {
      const result = await api.post('/seller/sales', sale);
      
      // Marcar como sincronizado
      sale.synced = true;
      sale.orderId = result.id;
      
      showToast(`Venda ${sale.localId} sincronizada!`);
    } catch (error) {
      console.error('Sync error:', error);
    }
  }
  
  // Actualizar storage
  await AsyncStorage.setItem(
    STORAGE_KEYS.PENDING_SALES,
    JSON.stringify(sales)
  );
};

// Ejecutar al volver online
NetInfo.addEventListener(state => {
  if (state.isConnected) {
    syncOfflineSales();
  }
});
```

## 📊 Analytics del Vendedor

### Métricas a Trackear
```typescript
interface SellerAnalytics {
  dailyStats: {
    date: Date;
    totalSales: number;
    orderCount: number;
    averageTicket: number;
    itemsSold: number;
    goalProgress: number;
  };
  
  weeklyStats: {
    // Similar structure
  };
  
  monthlyStats: {
    // Similar structure
  };
  
  topProducts: Array<{
    product: Product;
    quantitySold: number;
    revenue: number;
  }>;
  
  salesByHour: Array<{
    hour: number;
    count: number;
    revenue: number;
  }>;
  
  paymentMethodDistribution: {
    cash: number;
    card: number;
    pix: number;
    transfer: number;
  };
}
```

## 🔐 Seguridad

### Autorización de Gerente
Para operaciones sensibles (descuentos grandes, reembolsos):

```typescript
const requestManagerAuth = async () => {
  return new Promise((resolve) => {
    Alert.prompt(
      'Autorização Necessária',
      'Insira a senha do gerente:',
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        {
          text: 'OK',
          onPress: async (password) => {
            const isValid = await validateManagerPassword(password);
            resolve(isValid);
          },
        },
      ],
      'secure-text'
    );
  });
};
```

### Timeout de Sesión
```typescript
// Auto-logout después de inactividad
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos
let timeoutId: NodeJS.Timeout;

const resetTimeout = () => {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    logout();
    showAlert('Sessão Expirada', 'Faça login novamente');
  }, SESSION_TIMEOUT);
};

// Resetear en cada interacción
useEffect(() => {
  const subscription = AppState.addEventListener('change', resetTimeout);
  return () => subscription.remove();
}, []);
```

## 🎯 Métricas de Performance

### Objetivos
- Tiempo de escaneo a producto agregado: < 1 segundo
- Tiempo de crear venta completa: < 30 segundos
- Tiempo de procesamiento de pago: < 5 segundos
- Tiempo de sincronización offline: < 10 segundos

### Tracking
```typescript
import analytics from '@react-native-firebase/analytics';

// Trackear tiempo de venta
const trackSaleTime = (startTime: Date, endTime: Date) => {
  const duration = endTime.getTime() - startTime.getTime();
  
  analytics().logEvent('sale_completed', {
    duration_seconds: duration / 1000,
    item_count: activeSale.items.length,
    total_amount: activeSale.total,
    payment_method: activeSale.paymentMethod,
  });
};
```

## 📝 Checklist de Implementación

- [ ] SellerHomeScreen con stats
- [ ] ProductScannerScreen con cámara
- [ ] Búsqueda manual de productos
- [ ] ActiveSaleScreen con gestión de items
- [ ] Modificación de cantidades
- [ ] CustomerSearchScreen
- [ ] Crear cliente rápido
- [ ] PaymentScreen con todos los métodos
- [ ] Cálculo de cambio (efectivo)
- [ ] Integración PIX
- [ ] SalesHistoryScreen
- [ ] Auto-save de venta activa
- [ ] Modo offline completo
- [ ] Sincronización de ventas
- [ ] Sonidos y vibraciones
- [ ] Alertas de stock bajo
- [ ] Autorización de gerente
- [ ] Analytics de vendedor
- [ ] Timeout de sesión
- [ ] Productos frecuentes
- [ ] Ventas suspendidas
- [ ] Comprobante por email/WhatsApp
- [ ] Tests E2E del flujo completo

## 🚀 Próximos Pasos

1. Implementar navegación básica del Seller Navigator
2. Crear SellerHomeScreen con datos mock
3. Implementar ProductScannerScreen (primero búsqueda manual)
4. Agregar funcionalidad de cámara para escaneo
5. Desarrollar ActiveSaleScreen con todas las interacciones
6. Implementar PaymentScreen con método efectivo
7. Agregar resto de métodos de pago
8. Desarrollar modo offline
9. Testing exhaustivo
10. Optimizar performance

---

Este modo vendedor convierte tu app en una herramienta poderosa para aumentar las ventas y mejorar la eficiencia operativa. ¡Es tu ventaja competitiva! 🎯
