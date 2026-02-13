# Plataforma de Supermercado - Overview General del Proyecto

## 🎯 Visión General

Este documento proporciona una visión completa del proyecto de plataforma de supermercado, incluyendo la arquitectura general, cómo se conectan las diferentes partes, y las guías para cada componente.

## 📋 Componentes del Proyecto

### Arquitectura: Monorepo con Turborepo
- **Gestor de paquetes**: pnpm workspaces
- **Build system**: Turborepo
- **Archivo de setup**: `MONOREPO-SETUP.md`

### 1. Backend (NestJS + Prisma + PostgreSQL)
- **Ubicación**: `apps/backend/`
- **Propósito**: API centralizada para todas las aplicaciones
- **Archivo de instrucciones**: `BACKEND-INSTRUCTIONS.md`
- **Puerto**: 3000 (desarrollo)
- **Documentación API**: http://localhost:3000/api/docs (Swagger)

### 2. App Móvil (React Native)
- **Ubicación**: `apps/mobile/`
- **Propósito**: Aplicación para clientes, repartidores y vendedores (POS móvil)
- **Archivo de instrucciones**: `MOBILE-APP-INSTRUCTIONS.md`
- **Plataformas**: iOS y Android
- **Idioma**: Portugués brasileño

### 3. Web Cliente (Next.js)
- **Ubicación**: `apps/web-client/`
- **Propósito**: Sitio web para clientes
- **Archivo de instrucciones**: `WEB-CLIENT-INSTRUCTIONS.md`
- **Puerto**: 3001 (desarrollo)
- **URL producción**: https://supermercado.com
- **Idioma**: Portugués brasileño

### 4. Web Admin (Next.js)
- **Ubicación**: `apps/web-admin/`
- **Propósito**: Panel administrativo completo
- **Archivo de instrucciones**: `WEB-ADMIN-INSTRUCTIONS.md`
- **Puerto**: 3002 (desarrollo)
- **URL producción**: https://admin.supermercado.com
- **Idioma**: Portugués brasileño

### 5. Packages Compartidos
- **Ubicación**: `packages/`
- **Tipos**: `@supermercado/shared-types`
- **Validaciones**: `@supermercado/shared-validations`
- **Utilidades**: `@supermercado/shared-utils`
- **Constantes**: `@supermercado/shared-constants`
- **UI**: `@supermercado/ui` (componentes web compartidos)

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENTES                             │
├──────────────┬────────────────┬─────────────────────────────┤
│  App Móvil   │   Web Cliente  │      Web Admin              │
│ (React Native)│   (Next.js)   │      (Next.js)              │
└──────────────┴────────────────┴─────────────────────────────┘
                         │
                         │ HTTPS / WebSocket
                         ▼
            ┌────────────────────────┐
            │    Load Balancer       │
            └────────────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │     Backend API        │
            │   (NestJS)             │
            │   - REST API           │
            │   - WebSockets         │
            │   - Auth (JWT)         │
            └────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌──────────────┐  ┌──────────┐  ┌────────────────┐
│  PostgreSQL  │  │  Redis   │  │  File Storage  │
│  (Prisma)    │  │  (Cache) │  │  (AWS S3)      │
└──────────────┘  └──────────┘  └────────────────┘
```

## 🔑 Flujo de Autenticación

```
1. Usuario envía credenciales
   ↓
2. Backend valida y genera JWT token
   ↓
3. Cliente almacena token
   ↓
4. Cliente envía token en cada request (Header: Authorization: Bearer <token>)
   ↓
5. Backend valida token y permite/deniega acceso
```

### Roles y Permisos

| Role      | Acceso                                                    |
|-----------|-----------------------------------------------------------|
| CUSTOMER  | App Móvil (modo cliente), Web Cliente                    |
| DELIVERY  | App Móvil (modo repartidor)                               |
| SELLER    | App Móvil (modo vendedor/POS móvil)                       |
| EMPLOYEE  | Web Admin (funciones limitadas)                           |
| MANAGER   | Web Admin (gestión completa excepto configuración)        |
| ADMIN     | Web Admin (acceso total)                                  |

## 🔄 Flujos Principales del Sistema

### Flujo de Compra (Cliente)

```
1. Cliente navega productos
   ↓
2. Agrega productos al carrito
   ↓
3. Procede al checkout
   ↓
4. Ingresa información de envío
   ↓
5. Selecciona método de pago
   ↓
6. Confirma orden
   ↓
7. Backend:
   - Valida stock
   - Procesa pago
   - Crea orden
   - Actualiza inventario
   - Envía notificación
   ↓
8. Cliente recibe confirmación
```

### Flujo de Entrega (Delivery)

```
1. Nueva orden es asignada a repartidor
   ↓
2. Repartidor recibe notificación
   ↓
3. Repartidor acepta entrega
   ↓
4. Repartidor actualiza estado: "Recogido"
   ↓
5. Sistema envía ubicación en tiempo real
   ↓
6. Cliente ve tracking en mapa
   ↓
7. Repartidor actualiza estado: "Entregado"
   ↓
8. Sistema actualiza orden
   ↓
9. Cliente puede calificar entrega
```

### Flujo de Inventario (Admin)

```
1. Sistema detecta stock bajo
   ↓
2. Envía alerta al administrador
   ↓
3. Admin crea orden de compra
   ↓
4. Orden es enviada a proveedor
   ↓
5. Al recibir productos:
   - Admin registra recepción
   - Sistema actualiza inventario
   - Sistema registra movimiento
```

## 🌐 APIs y Endpoints Principales

### Autenticación
```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/refresh
POST   /api/auth/logout
```

### Productos
```
GET    /api/products
GET    /api/products/:id
POST   /api/products              (Admin)
PUT    /api/products/:id          (Admin)
DELETE /api/products/:id          (Admin)
```

### Carrito
```
GET    /api/cart
POST   /api/cart/items
PUT    /api/cart/items/:id
DELETE /api/cart/items/:id
```

### Órdenes
```
GET    /api/orders
GET    /api/orders/:id
POST   /api/orders
PUT    /api/orders/:id/status     (Employee+)
```

### Inventario
```
GET    /api/inventory
POST   /api/inventory/movements   (Employee+)
GET    /api/inventory/low-stock   (Employee+)
```

## 🔌 WebSockets - Eventos en Tiempo Real

### Para Clientes
```javascript
// Suscribirse a actualizaciones de orden
socket.on('order:status', (data) => {
  // data: { orderId, status, timestamp }
});

// Tracking de entrega
socket.on('delivery:location', (data) => {
  // data: { orderId, lat, lng, estimatedTime }
});
```

### Para Repartidores
```javascript
// Nueva entrega asignada
socket.on('delivery:assigned', (data) => {
  // data: { orderId, pickupAddress, deliveryAddress }
});
```

### Para Administradores
```javascript
// Nueva orden
socket.on('order:new', (data) => {
  // data: { order, customer }
});

// Alerta de inventario
socket.on('inventory:low', (data) => {
  // data: { productId, currentStock, minStock }
});

// Pago recibido
socket.on('payment:received', (data) => {
  // data: { orderId, amount, method }
});
```

## 💾 Base de Datos

### Archivo Schema
- **Ubicación**: `schema.prisma`
- **Tablas principales**: 30+ modelos
- **Relaciones**: Completamente definidas

### Comandos Prisma Útiles
```bash
# Generar cliente
npx prisma generate

# Crear migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones
npx prisma migrate deploy

# Abrir Prisma Studio
npx prisma studio

# Seed de datos
npx prisma db seed
```

## 🔐 Variables de Entorno

### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/supermercado"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
REDIS_HOST="localhost"
REDIS_PORT=6379
STRIPE_SECRET_KEY="sk_test_..."
MERCADOPAGO_ACCESS_TOKEN="..."
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_BUCKET_NAME="..."
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
NEXT_PUBLIC_WS_URL="http://localhost:3000"
NEXT_PUBLIC_STRIPE_KEY="pk_test_..."
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3001"
```

### App Móvil (.env)
```env
API_URL="http://localhost:3000/api"
SOCKET_URL="http://localhost:3000"
GOOGLE_MAPS_API_KEY="..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

## 🚀 Scripts de Inicio

### Desarrollo Local Completo
```bash
# Terminal 1: Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev

# Terminal 2: Web Cliente
cd web-client
npm install
npm run dev

# Terminal 3: Web Admin
cd web-admin
npm install
npm run dev

# Terminal 4: App Móvil
cd mobile
npm install
npx react-native run-ios
# o
npx react-native run-android
```

## 📊 Monitoreo y Logs

### Logs del Sistema
- Backend: Winston logger → Archivos + Console
- Frontend: Console + Sentry (producción)
- Base de datos: SystemLog table

### Métricas Importantes
- Tiempo de respuesta de API
- Tasa de conversión
- Abandono de carrito
- Stock bajo
- Órdenes por hora
- Uptime del sistema

## 🧪 Testing

### Backend
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

### Frontend
```bash
# Unit tests
npm run test

# E2E con Cypress/Playwright
npm run test:e2e
```

### App Móvil
```bash
# Unit tests
npm run test

# E2E con Detox
npm run test:e2e
```

## 📦 Deployment

### Backend (DigitalOcean / AWS / Railway)
```bash
# Build
npm run build

# Start
npm run start:prod
```

### Web Cliente & Admin (Vercel)
```bash
# Automático con git push a main
# o manual:
vercel --prod
```

### App Móvil
- **iOS**: TestFlight → App Store
- **Android**: Google Play Console

## 🔄 CI/CD Pipeline

```yaml
# Ejemplo GitHub Actions
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test
      - name: Build
        run: npm run build
      - name: Deploy
        if: github.ref == 'refs/heads/main'
        run: # deployment script
```

## 📚 Documentación de Referencia

Cada componente tiene su propio archivo de instrucciones detalladas:

1. **`schema.prisma`**
   - Schema completo de la base de datos
   - Todos los modelos, relaciones e índices

2. **`BACKEND-INSTRUCTIONS.md`**
   - Estructura del backend
   - Módulos y servicios
   - Guards y middleware
   - Testing y deployment

3. **`MOBILE-APP-INSTRUCTIONS.md`**
   - Estructura de la app
   - Navegación y screens
   - Estado global
   - Notificaciones push

4. **`WEB-CLIENT-INSTRUCTIONS.md`**
   - Estructura del sitio web
   - Páginas y componentes
   - SEO y performance
   - PWA configuration

5. **`WEB-ADMIN-INSTRUCTIONS.md`**
   - Panel administrativo completo
   - Dashboard y analytics
   - Gestión de recursos
   - Reportes y exports

## 🎯 Orden de Desarrollo Recomendado

### Semana 1-3: Backend Core
1. Setup del proyecto
2. Schema de Prisma y migraciones
3. Módulo de autenticación
4. Módulos de productos y categorías

### Semana 4-6: Backend Business Logic
1. Módulos de carrito y órdenes
2. Módulo de pagos
3. Módulo de inventario
4. WebSockets básicos

### Semana 7-9: Web Cliente
1. Setup y autenticación
2. Catálogo de productos
3. Carrito y checkout
4. Cuenta de usuario

### Semana 10-12: App Móvil
1. Setup y navegación
2. Pantallas principales
3. Integración con backend
4. Notificaciones push

### Semana 13-15: Web Admin
1. Dashboard
2. Gestión de productos/inventario
3. Gestión de órdenes
4. Analytics y reportes

### Semana 16-18: Features Avanzadas
1. Modo delivery
2. Programa de lealtad
3. Sistema de reseñas
4. Optimizaciones

### Semana 19-20: Testing y Deploy
1. Tests completos
2. Bug fixes
3. Performance optimization
4. Deployment a producción

## 🆘 Troubleshooting Común

### Backend no conecta a la base de datos
```bash
# Verificar que PostgreSQL esté corriendo
psql -U postgres

# Verificar DATABASE_URL en .env
echo $DATABASE_URL
```

### Frontend no puede hacer requests al backend
```bash
# Verificar CORS en backend
# main.ts debe tener:
app.enableCors({
  origin: ['http://localhost:3001', 'http://localhost:3002'],
  credentials: true,
});
```

### WebSocket no conecta
```bash
# Verificar configuración en backend y que el puerto esté abierto
# Verificar que el cliente use la URL correcta
```

## 📞 Recursos de Ayuda

- **NestJS**: https://docs.nestjs.com/
- **Prisma**: https://www.prisma.io/docs/
- **Next.js**: https://nextjs.org/docs
- **React Native**: https://reactnative.dev/docs
- **Tailwind**: https://tailwindcss.com/docs
- **Shadcn/ui**: https://ui.shadcn.com/

## 🎉 ¡Comencemos!

Ahora que tienes todo el contexto y la estructura clara:

1. Comienza por el **Backend** usando `BACKEND-INSTRUCTIONS.md`
2. Luego puedes trabajar en paralelo en los frontends
3. Usa este documento como referencia general

**Importante**: En cada chat nuevo que abras para trabajar en una parte específica:
1. Menciona que es parte de este proyecto de plataforma de supermercado
2. Referencia el archivo de instrucciones correspondiente
3. El asistente tendrá todo el contexto necesario para ayudarte

¡Mucho éxito con el proyecto! 🚀
