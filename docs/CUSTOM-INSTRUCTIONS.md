# Instrucciones Personalizadas del Proyecto - Plataforma de Supermercado

## 📍 Contexto General del Proyecto

### Información del Negocio
- **Ubicación**: Venâncio Aires, Rio Grande do Sul, Brasil
- **Alcance inicial**: Venâncio Aires
- **Visión de expansión**: Toda la región de Rio Grande do Sul
- **Identidad**: Marca con identidad gaúcha fuerte pero escalable
- **Modelo de negocio**: Supermercado online con entregas a domicilio y ventas en almacén

### Stack Tecnológico Confirmado
- **Arquitectura**: Monorepo con Turborepo + pnpm workspaces
- **Backend**: NestJS + Prisma + PostgreSQL
- **App Móvil**: React Native (iOS + Android)
- **Web Cliente**: Next.js 14+ (App Router)
- **Web Admin**: Next.js 14+ (App Router)
- **Packages Compartidos**: TypeScript types, validaciones Zod, utilidades

### Idioma de la Aplicación
- **Código**: Inglés (nombres de variables, funciones, comentarios técnicos)
- **Textos visibles al usuario**: **PORTUGUÉS BRASILEÑO** (todos los textos de UI, mensajes, etiquetas, botones, etc.)

## 🎯 Características Únicas del Proyecto

### 1. App Móvil con Tres Modos de Usuario

La aplicación móvil debe soportar **tres roles diferentes** con experiencias distintas:

#### A. Modo Cliente (CUSTOMER)
- Navegación de productos y categorías
- Carrito de compras y checkout
- Seguimiento de pedidos
- Perfil y direcciones
- Programa de lealtad
- Wishlist

#### B. Modo Repartidor (DELIVERY)
- Dashboard de entregas activas
- Navegación GPS a direcciones
- Actualización de estado de entregas
- Tracking en tiempo real
- Historial de entregas

#### C. Modo Vendedor (SELLER) - **CARACTERÍSTICA CLAVE**
**Propósito**: Sistema POS (Punto de Venta) móvil Y sistema de preparación de pedidos (order picking)

**Funcionalidad 1: POS Móvil**
Los vendedores pueden:
- Realizar ventas mientras se mueven por el almacén
- Escanear códigos de barras de productos
- Crear ventas/pedidos directamente desde el piso de ventas
- Procesar pagos en efectivo, tarjeta, PIX
- Vincular clientes a las ventas
- Ver historial de ventas
- Suspender y recuperar ventas

**Funcionalidad 2: Preparación de Pedidos (Order Picking)**
Cuando un cliente hace una compra online (desde app o web), el vendedor:
- Recibe notificación del nuevo pedido
- Ve lista completa de productos a recoger
- Se mueve por el almacén escaneando cada producto
- Cada producto escaneado se marca como "recogido" ✓
- Sistema valida que sea el producto correcto
- Muestra progreso en tiempo real (ej: 3/5 items)
- Al completar todos los items, marca pedido como "listo"
- Cliente recibe notificación de que su pedido está listo

**Flujo típico de picking:**
```
1. Cliente compra online → Backend crea Order (CONFIRMED)
2. Vendedor recibe notificación push + sonido
3. Vendedor acepta pedido en OrderQueueScreen
4. App muestra OrderPickingScreen con lista de items
5. Vendedor camina por almacén con app abierta
6. Escanea código de barras de cada producto
7. Sistema valida: ¿Es el producto correcto? 
   - ✅ Sí → Marca como recogido, sonido de éxito
   - ❌ No → Alerta "producto incorrecto"
8. Progreso se actualiza (3/5 → 4/5 → 5/5)
9. Todos recogidos → Pantalla de celebración
10. Vendedor marca como "Listo para entrega/pickup"
11. Si es delivery: notifica a repartidores
12. Cliente recibe notificación
```

**Pantallas específicas del modo vendedor:**
- `SellerHomeScreen`: Dashboard con stats + pedidos pendientes
- `OrderQueueScreen`: Lista de pedidos online esperando preparación
- `OrderPickingScreen`: Lista de items a recoger con progreso
- `BarcodeScannerScreen`: Escaneo con validación de producto
- `ProductScannerScreen`: Escaneo para POS móvil (venta nueva)
- `ActiveSaleScreen`: Carrito de venta activa
- `CustomerSearchScreen`: Buscar/crear clientes
- `PaymentScreen`: Procesamiento de pagos
- `SalesHistoryScreen`: Historial de ventas

**Features especiales:**
- **Ruta óptima**: Items ordenados por ubicación en almacén
- **Validación estricta**: Solo acepta el código de barras correcto
- **Items faltantes**: Opciones de sustitución o contactar cliente
- **Marcación manual**: Para casos especiales (con justificación)
- **Modo offline**: Guardar progreso y sincronizar después
- **Analytics**: Tiempo promedio, items por hora, precisión

### 2. Roles del Sistema

```typescript
enum Role {
  CUSTOMER  // Cliente final - App Móvil (modo cliente) + Web Cliente
  SELLER    // Vendedor - App Móvil (modo vendedor/POS)
  DELIVERY  // Repartidor - App Móvil (modo delivery)
  EMPLOYEE  // Empleado - Web Admin (permisos limitados)
  MANAGER   // Gerente - Web Admin (permisos amplios)
  ADMIN     // Administrador - Web Admin (acceso total)
}
```

### 3. Estructura del Monorepo

```
supermercado-platform/
├── apps/
│   ├── backend/              # NestJS API
│   ├── mobile/               # React Native (3 modos)
│   ├── web-client/           # Next.js para clientes
│   └── web-admin/            # Next.js panel admin
├── packages/
│   ├── shared/
│   │   ├── types/            # @supermercado/shared-types
│   │   ├── validations/      # @supermercado/shared-validations
│   │   ├── utils/            # @supermercado/shared-utils
│   │   └── constants/        # @supermercado/shared-constants
│   └── ui/                   # @supermercado/ui (web components)
├── docs/
│   ├── PROJECT-OVERVIEW.md
│   ├── MONOREPO-SETUP.md
│   ├── schema.prisma
│   └── [otros archivos de instrucciones]
└── tools/
```

## 🌐 Localización (i18n)

### Portugués Brasileño - Ejemplos de Textos

**Modo Cliente:**
- "Adicionar ao carrinho"
- "Finalizar compra"
- "Meus pedidos"
- "Rastrear entrega"
- "Produto não disponível"

**Modo Vendedor:**
- "Nova venda"
- "Escanear código de barras"
- "Buscar produto"
- "Cliente vinculado"
- "Ir para pagamento"
- "Dinheiro recebido"
- "Troco"
- "Venda concluída"
- "Suspender venda"

**Modo Repartidor:**
- "Entregas ativas"
- "Marcar como recolhido"
- "Marcar como entregue"
- "Navegação"

**Web Cliente:**
- "Compre online"
- "Entrega rápida"
- "Ofertas da semana"
- "Minha conta"

**Web Admin:**
- "Painel de controle"
- "Gestão de estoque"
- "Vendas do dia"
- "Novo produto"
- "Relatórios"

### Implementación i18n

**Opción recomendada**: `i18next` con `react-i18next`

```typescript
// packages/shared/i18n/src/pt-BR.json
{
  "common": {
    "add_to_cart": "Adicionar ao carrinho",
    "checkout": "Finalizar compra",
    "cancel": "Cancelar",
    "confirm": "Confirmar"
  },
  "seller": {
    "new_sale": "Nova venda",
    "scan_barcode": "Escanear código de barras",
    "search_product": "Buscar produto",
    "active_sale": "Venda ativa",
    "payment": "Pagamento",
    "cash_received": "Dinheiro recebido",
    "change": "Troco",
    "suspend_sale": "Suspender venda"
  }
}
```

## 🔑 Funcionalidades Críticas por Prioridad

### Fase 1 - MVP (Semanas 1-6)
1. ✅ Backend core (auth, productos, inventario)
2. ✅ App móvil - Modo Cliente básico
3. ✅ App móvil - Modo Vendedor (POS móvil)
4. ✅ Web Admin - Gestión básica de productos/órdenes

### Fase 2 - Expansión (Semanas 7-12)
1. ✅ App móvil - Modo Repartidor
2. ✅ Web Cliente completo
3. ✅ Sistema de pagos integrado
4. ✅ Notificaciones push
5. ✅ Tracking GPS

### Fase 3 - Optimización (Semanas 13-18)
1. ✅ Analytics avanzados
2. ✅ Programa de lealtad
3. ✅ Sistema de reseñas
4. ✅ Reportes automatizados
5. ✅ Optimizaciones de performance

## 🛠️ Consideraciones Técnicas Específicas

### Backend - Endpoints Específicos para Modo Vendedor

```typescript
// Crear venta (desde app de vendedor)
POST /api/seller/sales
Body: {
  items: [{ productId, quantity, unitPrice, discount? }],
  customerId?: string,
  discount?: number,
  paymentMethod: 'CASH' | 'CARD' | 'PIX' | 'TRANSFER',
  paymentAmount?: number, // Para cálculo de cambio
  notes?: string
}

// Buscar producto por código de barras
GET /api/seller/products/barcode/:barcode

// Buscar clientes
GET /api/seller/customers/search?q=nombre

// Crear cliente rápido
POST /api/seller/customers/quick
Body: { name, phone, email? }

// Historial de ventas del vendedor
GET /api/seller/sales/history?date=2024-01-01

// Suspender venta
POST /api/seller/sales/:id/suspend

// Recuperar venta suspendida
GET /api/seller/sales/suspended

// Procesar reembolso (si tiene permiso)
POST /api/seller/sales/:id/refund
```

### App Móvil - Navegación por Rol

```typescript
// App.tsx o RootNavigator.tsx
function RootNavigator() {
  const { user } = useAuth();
  
  if (!user) {
    return <AuthNavigator />;
  }
  
  // Navegar según rol
  switch (user.role) {
    case 'CUSTOMER':
      return <MainNavigator />;
    case 'DELIVERY':
      return <DeliveryNavigator />;
    case 'SELLER':
      return <SellerNavigator />;
    default:
      return <ErrorScreen />;
  }
}
```

### Permisos Específicos

```typescript
// packages/shared/constants/src/permissions.ts
export const SELLER_PERMISSIONS = {
  CREATE_SALE: 'seller:create_sale',
  VIEW_STOCK: 'seller:view_stock',
  SEARCH_CUSTOMER: 'seller:search_customer',
  CREATE_CUSTOMER: 'seller:create_customer',
  APPLY_DISCOUNT: 'seller:apply_discount',
  APPLY_LARGE_DISCOUNT: 'seller:apply_large_discount', // >20%
  PROCESS_REFUND: 'seller:process_refund',
  SUSPEND_SALE: 'seller:suspend_sale',
  VIEW_SALES_HISTORY: 'seller:view_sales_history',
};
```

## 📱 Integración de Hardware (App Móvil)

### Escáner de Código de Barras
```typescript
// Usar react-native-camera o expo-camera
import { Camera } from 'react-native-camera';

// Formatos soportados
const BARCODE_TYPES = [
  'ean13', // Más común en Brasil
  'ean8',
  'code128',
  'code39',
  'qr',
];
```

### Impresora Bluetooth (Opcional)
Para imprimir comprobantes desde app de vendedor:
```typescript
// react-native-bluetooth-escpos-printer
import BluetoothPrinter from 'react-native-bluetooth-escpos-printer';

async function printReceipt(sale: Sale) {
  await BluetoothPrinter.printText(
    `VENDA #${sale.orderNumber}\n` +
    `Cliente: ${sale.customer?.name || 'Anônimo'}\n` +
    // ... resto del comprobante
  );
}
```

## 🔄 Sincronización Offline (Modo Vendedor)

**Escenario**: Vendedor está en almacén sin WiFi

```typescript
// Usar AsyncStorage + Queue
interface PendingSale {
  id: string;
  localId: string; // UUID generado localmente
  items: SaleItem[];
  timestamp: Date;
  synced: boolean;
}

// Guardar venta localmente
async function saveSaleOffline(sale: Sale) {
  const pending = await AsyncStorage.getItem('pending_sales');
  const sales = pending ? JSON.parse(pending) : [];
  sales.push({ ...sale, synced: false, localId: uuid() });
  await AsyncStorage.setItem('pending_sales', JSON.stringify(sales));
}

// Sincronizar cuando vuelva internet
async function syncPendingSales() {
  const pending = await AsyncStorage.getItem('pending_sales');
  if (!pending) return;
  
  const sales = JSON.parse(pending);
  const unsynced = sales.filter(s => !s.synced);
  
  for (const sale of unsynced) {
    try {
      await createSale(sale);
      // Marcar como sincronizado
      sale.synced = true;
    } catch (error) {
      console.error('Error syncing sale:', error);
    }
  }
  
  await AsyncStorage.setItem('pending_sales', JSON.stringify(sales));
}
```

## 📊 Métricas Importantes para el Negocio

### Dashboard del Vendedor (App)
- Ventas del día: R$ total
- Cantidad de ventas: número
- Ticket promedio: R$
- Items vendidos: número
- Meta del día: progreso visual

### Analytics del Negocio
- GMV (Gross Merchandise Volume)
- Tasa de conversión
- AOV (Average Order Value)
- Productos más vendidos por canal (online vs vendedor)
- Desempeño por vendedor
- Horarios pico de ventas

## 🚀 Orden de Implementación Recomendado

### Sprint 1-2: Setup + Backend Core
1. Configurar monorepo (seguir MONOREPO-SETUP.md)
2. Backend: Auth, Users, Products, Categories
3. Shared packages: types, validations, utils

### Sprint 3-4: Modo Vendedor MVP
1. App móvil: Navegación base + Auth
2. SellerHomeScreen básico
3. ProductScannerScreen (con búsqueda manual primero)
4. ActiveSaleScreen
5. PaymentScreen (solo efectivo inicialmente)
6. Backend: Endpoints de seller/sales

### Sprint 5-6: Modo Cliente + Admin Básico
1. App móvil: Modo cliente básico
2. Web Admin: Login + Dashboard
3. Web Admin: CRUD de productos
4. Web Admin: Gestión de órdenes

### Sprint 7-8: Completar Modo Vendedor
1. Escáner de código de barras funcional
2. CustomerSearchScreen
3. Métodos de pago adicionales (tarjeta, PIX)
4. Ventas suspendidas
5. SalesHistoryScreen
6. Modo offline

### Sprint 9-10: Delivery + Pagos
1. Modo Repartidor
2. Integración de pagos (Stripe/MercadoPago)
3. Tracking GPS
4. Notificaciones push

### Sprint 11-12: Web Cliente
1. Catálogo de productos
2. Carrito y checkout
3. Seguimiento de pedidos
4. Perfil de usuario

### Sprint 13-16: Features Avanzadas
1. Programa de lealtad
2. Cupones y descuentos
3. Reseñas
4. Analytics completos
5. Reportes

## 🎨 Branding y Diseño

### Consideraciones de Marca
- Identidad gaúcha fuerte
- Colores que representen RS (sugerencia: verde/amarillo/rojo)
- Nombre que resuene localmente pero sea escalable
- Mascota o símbolo icónico (chimarrão, gaucho, etc.)

### Sistema de Diseño
- Mobile-first approach
- Botones grandes para fácil uso
- Feedback visual claro
- Accesibilidad (contraste, tamaños de fuente)
- Modo oscuro (opcional pero recomendado)

## ⚠️ Consideraciones Legales y Fiscales (Brasil)

### NF-e (Nota Fiscal Eletrônica)
- Integrar con servicio de emisión de NF-e
- Almacenar números de CNPJ/CPF de clientes
- Generar XML de NF-e para cada venta

### Pagos
- Integración con gateway brasileño (MercadoPago, PagSeguro, Stripe Brasil)
- Soporte para PIX (método de pago instantáneo)
- Cumplir con regulaciones de PCI-DSS para tarjetas

### LGPD (Lei Geral de Proteção de Dados)
- Política de privacidad clara
- Consentimiento para uso de datos
- Opción de eliminar cuenta y datos
- Encriptación de datos sensibles

## 📚 Documentos de Referencia

Todos los archivos ya creados que debes consultar:

1. **PROJECT-OVERVIEW.md** - Visión general completa
2. **MONOREPO-SETUP.md** - Setup paso a paso del monorepo
3. **schema.prisma** - Base de datos completa
4. **BACKEND-INSTRUCTIONS.md** - Guía del backend
5. **MOBILE-APP-INSTRUCTIONS.md** - Guía de la app móvil
6. **WEB-CLIENT-INSTRUCTIONS.md** - Guía del web cliente
7. **WEB-ADMIN-INSTRUCTIONS.md** - Guía del admin
8. **SELLER-MODE-DETAILED.md** - POS móvil (ventas nuevas)
9. **ORDER-PICKING-MODE.md** - Sistema de preparación de pedidos
10. **CUSTOM-INSTRUCTIONS.md** - Este archivo (instrucciones personalizadas)

## 🎯 Resumen Ejecutivo para Nuevos Chats

Cuando inicies un nuevo chat para trabajar en una parte específica del proyecto, proporciona este contexto:

```
Estoy trabajando en [BACKEND/APP MÓVIL/WEB CLIENTE/WEB ADMIN] de mi 
plataforma de supermercado online en Brasil (Venâncio Aires, RS).

Arquitectura: Monorepo con Turborepo + pnpm
Stack: NestJS + Prisma + PostgreSQL (backend), React Native (móvil), 
Next.js (webs)
Idioma: Portugués brasileño para todos los textos de UI

IMPORTANTE: La app móvil tiene 3 modos:
1. Cliente (compras online)
2. Repartidor (entregas)
3. Vendedor (POS móvil para ventas en almacén) ← CARACTERÍSTICA CLAVE

Adjunto el archivo de instrucciones correspondiente: 
[NOMBRE-DEL-ARCHIVO.md]

[DESCRIBE TU TAREA ESPECÍFICA]
```

## ✅ Checklist de Inicio de Desarrollo

Antes de comenzar a codear, asegúrate de:

- [ ] Leer PROJECT-OVERVIEW.md completo
- [ ] Seguir MONOREPO-SETUP.md para estructura
- [ ] Copiar schema.prisma a apps/backend/prisma/
- [ ] Configurar variables de entorno (.env files)
- [ ] Instalar dependencias: `pnpm install`
- [ ] Generar cliente Prisma: `pnpm prisma:generate`
- [ ] Ejecutar migraciones: `pnpm prisma:migrate`
- [ ] Verificar que todo compila: `pnpm build`
- [ ] Iniciar desarrollo: `pnpm dev`

## 🎉 ¡Listo para Desarrollar!

Con toda esta información, tienes un mapa completo para desarrollar la 
plataforma de supermercado con todas sus características únicas.

**Siguiente paso**: Comenzar con el setup del monorepo siguiendo 
MONOREPO-SETUP.md

**Orden sugerido**:
1. Setup del monorepo
2. Backend core (Auth + Products)
3. App móvil - Modo Vendedor (POS móvil)
4. Web Admin - Gestión básica
5. Resto de features
