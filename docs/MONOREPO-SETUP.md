# Setup del Monorepo con Turborepo

## 🎯 Objetivo

Configurar un monorepo con Turborepo que contenga todos los componentes de la plataforma de supermercado, permitiendo compartir código, tipos y utilidades de manera eficiente.

## 📋 Prerrequisitos

- Node.js 18+ instalado
- pnpm instalado (recomendado) o npm/yarn
- Git instalado

```bash
# Instalar pnpm globalmente
npm install -g pnpm
```

## 🚀 Paso 1: Crear el Monorepo

```bash
# Opción A: Desde cero
mkdir supermercado-platform
cd supermercado-platform
pnpm init

# Opción B: Con create-turbo (más rápido)
npx create-turbo@latest supermercado-platform
cd supermercado-platform
```

## 📁 Paso 2: Estructura de Carpetas

```bash
# Crear estructura completa
mkdir -p apps/{backend,web-client,web-admin,mobile}
mkdir -p packages/{shared,ui,config}
mkdir -p packages/shared/{types,utils,validations,constants}
mkdir -p tools/{scripts,generators}
mkdir -p docs
```

Estructura final:
```
supermercado-platform/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-backend.yml
│       ├── deploy-web-client.yml
│       └── deploy-web-admin.yml
├── apps/
│   ├── backend/                    # NestJS
│   │   ├── src/
│   │   ├── test/
│   │   ├── prisma/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── nest-cli.json
│   ├── web-client/                 # Next.js cliente
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── public/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── next.config.js
│   ├── web-admin/                  # Next.js admin
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── public/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── next.config.js
│   └── mobile/                     # React Native
│       ├── src/
│       ├── android/
│       ├── ios/
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── shared/
│   │   ├── types/                  # TypeScript types compartidos
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── product.ts
│   │   │   │   ├── user.ts
│   │   │   │   ├── order.ts
│   │   │   │   └── ...
│   │   │   ├── package.json
│   │   │   └── tsconfig.json
│   │   ├── utils/                  # Utilidades compartidas
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── formatters.ts
│   │   │   │   ├── validators.ts
│   │   │   │   └── helpers.ts
│   │   │   ├── package.json
│   │   │   └── tsconfig.json
│   │   ├── validations/            # Schemas Zod
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── product.schema.ts
│   │   │   │   ├── user.schema.ts
│   │   │   │   └── order.schema.ts
│   │   │   ├── package.json
│   │   │   └── tsconfig.json
│   │   └── constants/              # Constantes
│   │       ├── src/
│   │       │   ├── index.ts
│   │       │   ├── roles.ts
│   │       │   ├── statuses.ts
│   │       │   └── config.ts
│   │       ├── package.json
│   │       └── tsconfig.json
│   ├── ui/                         # Componentes UI compartidos (web)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── components/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── config/                     # Configs compartidas
│       ├── eslint/
│       ├── typescript/
│       └── tailwind/
├── tools/
│   ├── scripts/
│   │   ├── setup.sh
│   │   ├── seed-db.ts
│   │   └── generate-types.ts
│   └── generators/
├── docs/
│   ├── PROJECT-OVERVIEW.md
│   ├── schema.prisma
│   ├── BACKEND-INSTRUCTIONS.md
│   ├── MOBILE-APP-INSTRUCTIONS.md
│   ├── WEB-CLIENT-INSTRUCTIONS.md
│   └── WEB-ADMIN-INSTRUCTIONS.md
├── .gitignore
├── .npmrc
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

## ⚙️ Paso 3: Configurar pnpm Workspaces

### pnpm-workspace.yaml
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'packages/shared/*'
```

### .npmrc
```
shamefully-hoist=true
strict-peer-dependencies=false
auto-install-peers=true
```

## 📦 Paso 4: Root package.json

```json
{
  "name": "supermercado-platform",
  "version": "1.0.0",
  "private": true,
  "description": "Plataforma completa de supermercado online",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,md}\"",
    "clean": "turbo run clean && rm -rf node_modules",
    "type-check": "turbo run type-check",
    
    "backend:dev": "turbo run dev --filter=backend",
    "backend:build": "turbo run build --filter=backend",
    "backend:test": "turbo run test --filter=backend",
    
    "web:dev": "turbo run dev --filter=web-client",
    "web:build": "turbo run build --filter=web-client",
    
    "admin:dev": "turbo run dev --filter=web-admin",
    "admin:build": "turbo run build --filter=web-admin",
    
    "mobile:ios": "cd apps/mobile && npx react-native run-ios",
    "mobile:android": "cd apps/mobile && npx react-native run-android",
    
    "prisma:generate": "cd apps/backend && pnpm prisma generate",
    "prisma:migrate": "cd apps/backend && pnpm prisma migrate dev",
    "prisma:studio": "cd apps/backend && pnpm prisma studio"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "turbo": "^1.11.2",
    "typescript": "^5.3.3",
    "prettier": "^3.1.0",
    "eslint": "^8.55.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@8.12.0"
}
```

## 🔧 Paso 5: Configurar Turborepo

### turbo.json
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [
        "dist/**",
        ".next/**",
        "!.next/cache/**",
        "build/**"
      ]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"],
      "cache": true
    },
    "lint": {
      "dependsOn": ["^build"],
      "cache": true
    },
    "type-check": {
      "dependsOn": ["^build"],
      "cache": true
    },
    "clean": {
      "cache": false
    }
  }
}
```

## 📝 Paso 6: Configurar Packages Compartidos

### packages/shared/types/package.json
```json
{
  "name": "@supermercado/shared-types",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

### packages/shared/types/tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### packages/shared/types/src/index.ts
```typescript
// Re-export all types
export * from './product';
export * from './user';
export * from './order';
export * from './cart';
export * from './category';
export * from './address';
export * from './payment';
export * from './delivery';
export * from './inventory';
export * from './review';
export * from './coupon';
export * from './notification';
export * from './analytics';
export * from './common';
```

### packages/shared/types/src/product.ts
```typescript
export interface Product {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  
  categoryId: string;
  brandId?: string;
  
  price: number;
  costPrice?: number;
  compareAtPrice?: number;
  
  stock: number;
  minStock: number;
  maxStock?: number;
  
  unit: string;
  weight?: number;
  volume?: number;
  
  mainImageUrl?: string;
  images?: ProductImage[];
  
  status: ProductStatus;
  isFeatured: boolean;
  isOrganic: boolean;
  
  taxRate: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  position: number;
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED',
}

export interface CreateProductDto {
  sku: string;
  name: string;
  categoryId: string;
  price: number;
  stock: number;
  // ... más campos
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  id: string;
}
```

### packages/shared/validations/package.json
```json
{
  "name": "@supermercado/shared-validations",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

### packages/shared/validations/src/product.schema.ts
```typescript
import { z } from 'zod';

export const createProductSchema = z.object({
  sku: z.string().min(1, 'SKU es requerido'),
  barcode: z.string().optional(),
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  categoryId: z.string().uuid('ID de categoría inválido'),
  brandId: z.string().uuid().optional(),
  price: z.number().positive('Precio debe ser positivo'),
  costPrice: z.number().positive().optional(),
  stock: z.number().int().min(0, 'Stock no puede ser negativo'),
  minStock: z.number().int().min(0).default(5),
  unit: z.string().default('pz'),
  weight: z.number().positive().optional(),
  images: z.array(z.string().url()).min(1, 'Al menos una imagen es requerida'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED']).default('ACTIVE'),
  isFeatured: z.boolean().default(false),
  isOrganic: z.boolean().default(false),
  taxRate: z.number().min(0).max(100).default(16),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED']).optional(),
  sortBy: z.enum(['name', 'price', 'createdAt', 'stock']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
```

### packages/shared/utils/package.json
```json
{
  "name": "@supermercado/shared-utils",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

### packages/shared/utils/src/formatters.ts
```typescript
/**
 * Formatea un número como moneda mexicana
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

/**
 * Formatea una fecha en formato legible
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

/**
 * Formatea una fecha con hora
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Formatea un número como porcentaje
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formatea un peso en gramos/kilogramos
 */
export function formatWeight(grams: number): string {
  if (grams < 1000) {
    return `${grams}g`;
  }
  return `${(grams / 1000).toFixed(2)}kg`;
}

/**
 * Trunca texto con elipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Genera slug a partir de texto
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

### packages/shared/constants/src/roles.ts
```typescript
export enum Role {
  CUSTOMER = 'CUSTOMER',
  EMPLOYEE = 'EMPLOYEE',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
  DELIVERY = 'DELIVERY',
}

export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.CUSTOMER]: 0,
  [Role.DELIVERY]: 1,
  [Role.EMPLOYEE]: 2,
  [Role.MANAGER]: 3,
  [Role.ADMIN]: 4,
};

export const ROLE_LABELS: Record<Role, string> = {
  [Role.CUSTOMER]: 'Cliente',
  [Role.DELIVERY]: 'Repartidor',
  [Role.EMPLOYEE]: 'Empleado',
  [Role.MANAGER]: 'Gerente',
  [Role.ADMIN]: 'Administrador',
};
```

## 🔨 Paso 7: Configurar Apps

### apps/backend/package.json
```json
{
  "name": "backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main",
    "test": "jest",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\"",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@nestjs/common": "^10.3.0",
    "@nestjs/core": "^10.3.0",
    "@nestjs/platform-express": "^10.3.0",
    "@prisma/client": "^5.7.1",
    "@supermercado/shared-types": "workspace:*",
    "@supermercado/shared-validations": "workspace:*",
    "@supermercado/shared-utils": "workspace:*",
    "@supermercado/shared-constants": "workspace:*"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.2.1",
    "@nestjs/testing": "^10.3.0",
    "prisma": "^5.7.1",
    "typescript": "^5.3.3"
  }
}
```

### apps/web-client/package.json
```json
{
  "name": "web-client",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supermercado/shared-types": "workspace:*",
    "@supermercado/shared-validations": "workspace:*",
    "@supermercado/shared-utils": "workspace:*",
    "@supermercado/shared-constants": "workspace:*",
    "@supermercado/ui": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.45",
    "typescript": "^5.3.3"
  }
}
```

### apps/web-admin/package.json
```json
{
  "name": "web-admin",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev -p 3002",
    "build": "next build",
    "start": "next start -p 3002",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supermercado/shared-types": "workspace:*",
    "@supermercado/shared-validations": "workspace:*",
    "@supermercado/shared-utils": "workspace:*",
    "@supermercado/shared-constants": "workspace:*",
    "@supermercado/ui": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.45",
    "typescript": "^5.3.3"
  }
}
```

## 📱 Paso 8: Configurar TypeScript References

### tsconfig.json (root)
```json
{
  "files": [],
  "references": [
    { "path": "./packages/shared/types" },
    { "path": "./packages/shared/utils" },
    { "path": "./packages/shared/validations" },
    { "path": "./packages/shared/constants" },
    { "path": "./packages/ui" },
    { "path": "./apps/backend" },
    { "path": "./apps/web-client" },
    { "path": "./apps/web-admin" }
  ]
}
```

## 🚀 Paso 9: Instalar Dependencias

```bash
# Desde la raíz del proyecto
pnpm install

# Esto instalará todas las dependencias de todos los packages
```

## 🎯 Paso 10: Usar Packages Compartidos

### En Backend (NestJS)
```typescript
// apps/backend/src/modules/products/dto/create-product.dto.ts
import { createProductSchema, CreateProductInput } from '@supermercado/shared-validations';
import { Product } from '@supermercado/shared-types';
import { formatCurrency } from '@supermercado/shared-utils';

export class CreateProductDto implements CreateProductInput {
  // Validación con Zod en el controller
}

// apps/backend/src/modules/products/products.service.ts
import { Product } from '@supermercado/shared-types';

export class ProductsService {
  async create(data: CreateProductInput): Promise<Product> {
    // Lógica de creación
  }
}
```

### En Web Client (Next.js)
```typescript
// apps/web-client/app/products/[slug]/page.tsx
import { Product } from '@supermercado/shared-types';
import { formatCurrency, formatDate } from '@supermercado/shared-utils';
import { ProductStatus } from '@supermercado/shared-constants';

export default async function ProductPage({ params }: Props) {
  const product: Product = await getProduct(params.slug);
  
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{formatCurrency(product.price)}</p>
    </div>
  );
}
```

### En Web Admin (Next.js)
```typescript
// apps/web-admin/app/products/new/page.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProductSchema, CreateProductInput } from '@supermercado/shared-validations';
import { Role } from '@supermercado/shared-constants';

export default function NewProductPage() {
  const form = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
  });
  
  // Formulario validado
}
```

### En Mobile (React Native)
```typescript
// apps/mobile/src/screens/ProductDetailScreen.tsx
import { Product } from '@supermercado/shared-types';
import { formatCurrency } from '@supermercado/shared-utils';

export function ProductDetailScreen({ productId }: Props) {
  const { data: product } = useQuery<Product>({
    queryKey: ['product', productId],
    queryFn: () => getProduct(productId),
  });
  
  return (
    <View>
      <Text>{product.name}</Text>
      <Text>{formatCurrency(product.price)}</Text>
    </View>
  );
}
```

## 🧪 Paso 11: Scripts Útiles

### Desarrollo Completo
```bash
# Iniciar todo (backend + webs)
pnpm dev

# Solo backend
pnpm backend:dev

# Solo web cliente
pnpm web:dev

# Solo web admin
pnpm admin:dev
```

### Build
```bash
# Build todo
pnpm build

# Build específico
pnpm backend:build
pnpm web:build
pnpm admin:build
```

### Testing
```bash
# Test todo
pnpm test

# Test específico
turbo run test --filter=backend
```

## 📊 Paso 12: Configurar CI/CD

### .github/workflows/ci.yml
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Get pnpm store directory
        id: pnpm-cache
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT
      
      - name: Setup pnpm cache
        uses: actions/cache@v3
        with:
          path: ${{ steps.pnpm-cache.outputs.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Type check
        run: pnpm type-check
      
      - name: Lint
        run: pnpm lint
      
      - name: Test
        run: pnpm test
      
      - name: Build
        run: pnpm build
```

### .github/workflows/deploy-backend.yml
```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'apps/backend/**'
      - 'packages/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build backend
        run: pnpm backend:build
      
      # Aquí agregas tus pasos de deploy (Railway, Vercel, AWS, etc.)
```

## 🐳 Paso 13: Docker (Opcional)

### Dockerfile.backend
```dockerfile
FROM node:18-alpine AS base
RUN npm install -g pnpm

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm backend:build

FROM base AS runner
WORKDIR /app
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "dist/main"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: supermercado
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/supermercado
      REDIS_HOST: redis
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
```

## ✅ Paso 14: Verificación

```bash
# 1. Instalar todo
pnpm install

# 2. Verificar que los tipos se compartan correctamente
cd apps/backend
# Deberías poder importar:
# import { Product } from '@supermercado/shared-types';

# 3. Iniciar desarrollo
pnpm dev

# 4. Verificar que todo compile
pnpm build

# 5. Correr tests
pnpm test
```

## 🎉 ¡Listo!

Ahora tienes un monorepo completamente configurado con:

✅ Turborepo para builds rápidos
✅ pnpm workspaces para gestión de dependencias
✅ Tipos TypeScript compartidos
✅ Validaciones compartidas (Zod)
✅ Utilidades compartidas
✅ CI/CD configurado
✅ Scripts útiles para desarrollo

## 📚 Comandos Útiles del Día a Día

```bash
# Agregar dependencia a un package específico
pnpm add axios --filter=backend
pnpm add react-query --filter=web-client

# Agregar dependencia a un shared package
pnpm add dayjs --filter=@supermercado/shared-utils

# Remover dependencia
pnpm remove axios --filter=backend

# Limpiar todo
pnpm clean
rm -rf node_modules
pnpm install

# Ver dependencias
pnpm list --depth=0

# Actualizar dependencias
pnpm update

# Rebuild de un package específico
turbo run build --filter=backend --force
```

## 🔍 Troubleshooting

### Error: Cannot find module '@supermercado/shared-types'

```bash
# Solución: Regenerar symlinks
pnpm install
```

### Error: Type error en imports compartidos

```bash
# Solución: Rebuild de shared packages
turbo run build --filter=@supermercado/shared-*
```

### Cache de Turbo causando problemas

```bash
# Limpiar cache
turbo run build --force
# o
rm -rf .turbo
```

## 📖 Recursos Adicionales

- [Turborepo Docs](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)

---

**Siguiente paso**: Una vez configurado el monorepo, comienza con el desarrollo del backend usando `BACKEND-INSTRUCTIONS.md`
