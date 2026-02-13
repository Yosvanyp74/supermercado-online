# Backend - NestJS + Prisma + PostgreSQL

## Contexto del Proyecto
Plataforma completa de supermercado con:
- App móvil (React Native)
- Web cliente (Next.js)
- Web administrativa (Next.js)
- Backend centralizado (NestJS + Prisma + PostgreSQL)

## Objetivos del Backend
- API RESTful completa para todas las funcionalidades
- Autenticación JWT con roles múltiples
- WebSockets para actualizaciones en tiempo real
- Sistema de notificaciones
- Integración con pasarelas de pago
- Sistema de analytics y reportes

## Stack Tecnológico
- **Framework**: NestJS
- **ORM**: Prisma
- **Base de datos**: PostgreSQL
- **Autenticación**: JWT + Passport
- **WebSockets**: Socket.io
- **Validación**: class-validator + class-transformer
- **Documentación**: Swagger
- **Testing**: Jest
- **Caché**: Redis

## Estructura del Proyecto

```
backend/
├── prisma/
│   ├── schema.prisma          # Ya definido (usar el archivo schema.prisma)
│   ├── migrations/
│   └── seed.ts                # Seeds iniciales
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/                # Utilidades compartidas
│   │   ├── decorators/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── filters/
│   │   └── pipes/
│   ├── config/                # Configuraciones
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   └── swagger.config.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── local.strategy.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       ├── register.dto.ts
│   │   │       └── refresh-token.dto.ts
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   ├── update-user.dto.ts
│   │   │   │   └── user-response.dto.ts
│   │   │   └── entities/
│   │   ├── products/
│   │   │   ├── products.module.ts
│   │   │   ├── products.controller.ts
│   │   │   ├── products.service.ts
│   │   │   ├── dto/
│   │   │   └── entities/
│   │   ├── categories/
│   │   ├── inventory/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── delivery/
│   │   ├── cart/
│   │   ├── wishlist/
│   │   ├── reviews/
│   │   ├── notifications/
│   │   ├── loyalty/
│   │   ├── coupons/
│   │   ├── suppliers/
│   │   ├── analytics/
│   │   └── reports/
│   └── prisma/                # Servicio de Prisma
│       ├── prisma.module.ts
│       └── prisma.service.ts
├── test/
├── .env
├── .env.example
├── package.json
├── tsconfig.json
└── nest-cli.json
```

## Módulos Principales a Desarrollar

### 1. Auth Module
**Responsabilidades:**
- Login/Register
- JWT token generation y refresh
- Password reset
- Email verification
- Role-based authentication

**Endpoints principales:**
```
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
POST   /auth/forgot-password
POST   /auth/reset-password
POST   /auth/verify-email
GET    /auth/me
```

**Guards necesarios:**
- JwtAuthGuard
- RolesGuard
- EmailVerifiedGuard

### 2. Users Module
**Responsabilidades:**
- CRUD de usuarios
- Gestión de perfiles
- Direcciones
- Métodos de pago guardados

**Endpoints principales:**
```
GET    /users
GET    /users/:id
PATCH  /users/:id
DELETE /users/:id
GET    /users/:id/addresses
POST   /users/:id/addresses
PATCH  /users/:id/addresses/:addressId
DELETE /users/:id/addresses/:addressId
GET    /users/:id/orders
```

### 3. Products Module
**Responsabilidades:**
- CRUD de productos
- Búsqueda y filtrado
- Gestión de imágenes
- Stock management
- Productos destacados

**Endpoints principales:**
```
GET    /products              # Con filtros, búsqueda, paginación
GET    /products/:id
GET    /products/slug/:slug
POST   /products              # Admin only
PATCH  /products/:id          # Admin only
DELETE /products/:id          # Admin only
POST   /products/:id/images   # Admin only
GET    /products/featured
GET    /products/search?q=
```

**Filtros a implementar:**
- Por categoría
- Por marca
- Por rango de precio
- Por disponibilidad
- Por etiquetas (orgánico, etc)
- Ordenamiento (precio, nombre, popularidad)

### 4. Categories Module
**Responsabilidades:**
- CRUD de categorías
- Jerarquía de categorías
- Productos por categoría

**Endpoints principales:**
```
GET    /categories
GET    /categories/:id
GET    /categories/:id/products
POST   /categories            # Admin only
PATCH  /categories/:id        # Admin only
DELETE /categories/:id        # Admin only
```

### 5. Inventory Module
**Responsabilidades:**
- Control de stock
- Movimientos de inventario
- Alertas de stock bajo
- Ajustes de inventario

**Endpoints principales:**
```
GET    /inventory
GET    /inventory/:productId
POST   /inventory/movements   # Employee+
GET    /inventory/movements
GET    /inventory/low-stock   # Employee+
POST   /inventory/adjust      # Manager+
```

### 6. Cart Module
**Responsabilidades:**
- Gestión de carrito
- Carrito de invitados (session-based)
- Sincronización al login

**Endpoints principales:**
```
GET    /cart
POST   /cart/items
PATCH  /cart/items/:itemId
DELETE /cart/items/:itemId
DELETE /cart
POST   /cart/merge            # Merge guest cart with user cart
```

### 7. Orders Module
**Responsabilidades:**
- Creación de órdenes
- Procesamiento de órdenes
- Estados de órdenes
- Historial de órdenes
- Cancelaciones y devoluciones

**Endpoints principales:**
```
POST   /orders
GET    /orders
GET    /orders/:id
PATCH  /orders/:id/status     # Employee+
POST   /orders/:id/cancel
GET    /orders/:id/tracking
```

**Estados del flujo de orden:**
1. PENDING → Cliente creó la orden
2. CONFIRMED → Sistema confirmó disponibilidad
3. PROCESSING → Preparando orden
4. READY_FOR_PICKUP / OUT_FOR_DELIVERY
5. DELIVERED
6. CANCELLED / REFUNDED

### 8. Payments Module
**Responsabilidades:**
- Procesamiento de pagos
- Integración con pasarelas (Stripe, MercadoPago)
- Webhooks de pasarelas
- Gestión de métodos de pago guardados

**Endpoints principales:**
```
POST   /payments/process
POST   /payments/webhooks/stripe
POST   /payments/webhooks/mercadopago
GET    /payments/:orderId
POST   /payments/refund/:orderId   # Admin only
```

**Pasarelas a integrar:**
- Stripe
- MercadoPago
- Pagos en efectivo (OXXO)
- SPEI

### 9. Delivery Module
**Responsabilidades:**
- Asignación de repartidores
- Tracking en tiempo real
- Optimización de rutas

**Endpoints principales:**
```
POST   /delivery/assign       # Manager+
GET    /delivery/active       # Delivery role
PATCH  /delivery/:id/location # Delivery role
GET    /delivery/:orderId/track
```

### 10. Reviews Module
**Responsabilidades:**
- Crear reseñas
- Moderación de reseñas
- Estadísticas de reseñas

**Endpoints principales:**
```
POST   /reviews
GET    /reviews/product/:productId
PATCH  /reviews/:id           # Own review
DELETE /reviews/:id           # Own review or Admin
PATCH  /reviews/:id/approve   # Admin only
```

### 11. Notifications Module
**Responsabilidades:**
- Envío de notificaciones push
- Notificaciones en app
- Preferencias de notificaciones
- WebSocket para real-time

**Endpoints principales:**
```
GET    /notifications
PATCH  /notifications/:id/read
PATCH  /notifications/read-all
GET    /notifications/preferences
PATCH  /notifications/preferences
```

**WebSocket events:**
- `notification:new`
- `order:status-changed`
- `delivery:location-update`

### 12. Loyalty Module
**Responsabilidades:**
- Gestión de puntos
- Canje de puntos
- Historial de puntos

**Endpoints principales:**
```
GET    /loyalty/points
GET    /loyalty/history
POST   /loyalty/redeem
GET    /loyalty/rewards
```

### 13. Coupons Module
**Responsabilidades:**
- CRUD de cupones
- Validación de cupones
- Aplicación de descuentos

**Endpoints principales:**
```
POST   /coupons/validate
GET    /coupons               # Admin only
POST   /coupons               # Admin only
PATCH  /coupons/:id           # Admin only
DELETE /coupons/:id           # Admin only
```

### 14. Suppliers Module
**Responsabilidades:**
- CRUD de proveedores
- Órdenes de compra
- Gestión de productos por proveedor

**Endpoints principales:**
```
GET    /suppliers             # Employee+
POST   /suppliers             # Manager+
GET    /suppliers/:id
PATCH  /suppliers/:id         # Manager+
POST   /purchase-orders       # Manager+
GET    /purchase-orders
PATCH  /purchase-orders/:id   # Manager+
```

### 15. Analytics Module
**Responsabilidades:**
- Métricas de ventas
- Productos más vendidos
- Analytics de usuarios
- Reportes automatizados

**Endpoints principales:**
```
GET    /analytics/sales
GET    /analytics/products
GET    /analytics/customers
GET    /analytics/revenue
```

### 16. Reports Module
**Responsabilidades:**
- Generación de reportes
- Exportación a PDF/Excel
- Reportes programados

**Endpoints principales:**
```
POST   /reports/generate
GET    /reports/:id
GET    /reports/templates
```

## Configuraciones Importantes

### Variables de Entorno (.env)
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/supermercado"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="1d"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_REFRESH_EXPIRES_IN="7d"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-password"

# Payments
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
MERCADOPAGO_ACCESS_TOKEN="..."

# Storage (AWS S3 o similar)
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_BUCKET_NAME="..."

# App
PORT=3000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3001"
ADMIN_URL="http://localhost:3002"
```

## Guards y Middleware a Implementar

### 1. JwtAuthGuard
Protege rutas que requieren autenticación

### 2. RolesGuard
Verifica roles de usuario (CUSTOMER, EMPLOYEE, MANAGER, ADMIN, DELIVERY)

### 3. EmailVerifiedGuard
Verifica que el email esté verificado

### 4. ThrottlerGuard
Rate limiting para prevenir abuso

### 5. LoggingInterceptor
Registra todas las requests

### 6. TransformInterceptor
Transforma respuestas a formato estándar

## DTOs y Validación

Usar class-validator para todas las validaciones:

```typescript
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
```

## WebSockets

### Eventos a implementar:

**Para clientes:**
- `notification:new` - Nueva notificación
- `order:status` - Cambio de estado de orden
- `cart:updated` - Carrito actualizado
- `product:stock` - Actualización de stock

**Para repartidores:**
- `delivery:assigned` - Nueva entrega asignada
- `delivery:cancelled` - Entrega cancelada

**Para administradores:**
- `order:new` - Nueva orden recibida
- `inventory:low` - Stock bajo
- `payment:received` - Pago recibido

## Prisma Service

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: any) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
```

## Testing

### Tipos de tests a implementar:

1. **Unit tests**: Para servicios y utilidades
2. **Integration tests**: Para controllers
3. **E2E tests**: Para flujos completos

### Ejemplo de test:
```typescript
describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsService, PrismaService],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create a product', async () => {
    // Test implementation
  });
});
```

## Documentación con Swagger

Configurar Swagger para documentación automática:

```typescript
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('Supermercado API')
  .setDescription('API completa para plataforma de supermercado')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

## Pasos de Implementación Sugeridos

### Fase 1: Setup inicial (Semana 1)
1. Inicializar proyecto NestJS
2. Configurar Prisma con el schema
3. Configurar PostgreSQL
4. Implementar módulo de Prisma
5. Configurar variables de entorno
6. Setup de Swagger

### Fase 2: Autenticación (Semana 1-2)
1. Auth module completo
2. Users module básico
3. JWT strategies
4. Guards de autenticación
5. Email verification

### Fase 3: Core business (Semana 2-4)
1. Products module
2. Categories module
3. Inventory module
4. Cart module
5. Wishlist module

### Fase 4: Órdenes y pagos (Semana 4-6)
1. Orders module
2. Payments module
3. Integración con pasarelas
4. Webhooks

### Fase 5: Entrega y logística (Semana 6-7)
1. Delivery module
2. WebSockets para tracking
3. Notificaciones en tiempo real

### Fase 6: Features adicionales (Semana 7-9)
1. Reviews module
2. Loyalty module
3. Coupons module
4. Suppliers module
5. Notifications module

### Fase 7: Analytics y reportes (Semana 9-10)
1. Analytics module
2. Reports module
3. Dashboard data endpoints

### Fase 8: Optimización y testing (Semana 10-12)
1. Tests completos
2. Optimización de queries
3. Implementar caché con Redis
4. Performance tuning
5. Security audit

## Consideraciones de Seguridad

1. **Sanitización de inputs**: Usar ValidationPipe global
2. **Rate limiting**: Implementar throttling
3. **CORS**: Configurar correctamente
4. **Helmet**: Protección de headers HTTP
5. **SQL Injection**: Prisma previene esto por defecto
6. **XSS**: Sanitizar outputs
7. **CSRF**: Tokens para operaciones críticas
8. **Passwords**: Bcrypt con salt rounds adecuados
9. **Secrets**: Nunca en código, siempre en .env
10. **Logs**: No registrar información sensible

## Optimizaciones de Performance

1. **Paginación**: Implementar en todos los listados
2. **Caché con Redis**: Para productos populares, categorías
3. **Índices en BD**: Ya definidos en el schema
4. **Lazy loading**: Para relaciones grandes
5. **Query optimization**: Usar select específicos
6. **Compression**: Habilitar compresión gzip
7. **CDN**: Para imágenes de productos

## Próximos Pasos

Una vez tengas este backend listo, podrás:
1. Conectar la app móvil (React Native)
2. Desarrollar el frontend web (Next.js)
3. Crear el panel administrativo (Next.js)
4. Todas las aplicaciones consumirán esta misma API

## Recursos Útiles

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Passport JWT Strategy](http://www.passportjs.org/packages/passport-jwt/)
- [Socket.io](https://socket.io/docs/)
