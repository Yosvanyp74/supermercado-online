# GUÍA PASO A PASO: Dashboard del Vendedor - Web Admin

## 🎯 OBJETIVO FINAL

Crear un dashboard completo para vendedores en la web admin que les permita:
1. Recibir notificaciones de nuevos pedidos en tiempo real
2. Ver lista de pedidos pendientes
3. Preparar pedidos escaneando códigos de barras
4. Ver progreso de preparación en tiempo real
5. Finalizar pedidos y notificar clientes

**IMPORTANTE**: El vendedor NO debe tener acceso a las secciones de admin (productos, categorías, inventario, etc.)

---

## 📋 ANTES DE COMENZAR

### Verificar Archivos Existentes

Antes de crear/modificar cualquier archivo, verifica si existe:

```bash
# Verificar estructura actual
ls -la apps/web-admin/app/
ls -la apps/web-admin/middleware.ts
ls -la apps/web-admin/lib/
```

### Dependencias Necesarias

Verifica que estas dependencias estén instaladas:

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "next-auth": "^4.24.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tanstack/react-query": "^5.0.0",
    "socket.io-client": "^4.6.0",
    "sonner": "^1.3.0",
    "lucide-react": "^0.300.0"
  }
}
```

Si falta alguna, instalar con:
```bash
cd apps/web-admin
pnpm add [nombre-del-paquete]
```

---

## PASO 1: MODIFICAR EL SISTEMA DE LOGIN

### Archivo: `apps/web-admin/app/(auth)/login/page.tsx`

**ACCIÓN**: MODIFICAR (si existe) o CREAR (si no existe)

**UBICACIÓN EXACTA**: `apps/web-admin/app/(auth)/login/page.tsx`

**INSTRUCCIONES**:
1. Si el archivo existe, RESPÁLDAR el código actual
2. Buscar la función que maneja el submit del formulario
3. AGREGAR lógica de redirección después del login exitoso
4. La redirección debe ser:
   - Si role === 'SELLER' → `/vendedor`
   - Si role === 'ADMIN' o 'MANAGER' o 'EMPLOYEE' → `/dashboard`
   - Cualquier otro rol → mostrar error "Sem permissão"

**CÓDIGO COMPLETO DEL ARCHIVO**:

```typescript
'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      // Intentar login
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email ou senha incorretos');
        return;
      }

      // Obtener sesión para ver el rol
      const response = await fetch('/api/auth/session');
      const session = await response.json();
      
      const userRole = session?.user?.role;

      // Redirigir según rol
      if (userRole === 'SELLER') {
        router.push('/vendedor');
      } else if (['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(userRole)) {
        router.push('/dashboard');
      } else {
        setError('Você não tem permissão para acessar o painel');
        await signIn('credentials', { redirect: false }); // Logout
      }
    } catch (err) {
      console.error('Erro no login:', err);
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo o Título */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Painel Administrativo
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Entre com suas credenciais
          </p>
        </div>

        {/* Formulario */}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

## PASO 2: MODIFICAR EL MIDDLEWARE EXISTENTE

### Archivo: `apps/web-admin/middleware.ts`

**ACCIÓN**: MODIFICAR (NO REEMPLAZAR COMPLETAMENTE)

**UBICACIÓN EXACTA**: `apps/web-admin/middleware.ts` (raíz de web-admin)

**INSTRUCCIONES**:
1. **ABRIR** el archivo existente
2. **BUSCAR** la función `middleware` o configuración de withAuth
3. **AGREGAR** lógica de redirección por rol SIN eliminar código existente
4. **AGREGAR** `/vendedor` al matcher de rutas protegidas

**CÓDIGO A AGREGAR** (no reemplazar todo, solo agregar esta lógica):

```typescript
// AGREGAR este import si no existe
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// MODIFICAR o AGREGAR esta función
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // AGREGAR: Protección de rutas del vendedor
    if (path.startsWith('/vendedor')) {
      // Solo vendedores pueden acceder a /vendedor
      if (token?.role !== 'SELLER') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // AGREGAR: Redirigir vendedores fuera del dashboard admin
    if (path.startsWith('/dashboard') && !path.startsWith('/dashboard/api')) {
      // Vendedores no pueden acceder al dashboard admin
      if (token?.role === 'SELLER') {
        return NextResponse.redirect(new URL('/vendedor', req.url));
      }
      
      // Verificar que tenga rol de admin/manager/employee
      if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(token?.role as string)) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }

    // MANTENER: Código existente del middleware aquí
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// MODIFICAR: Agregar /vendedor al matcher
export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/vendedor/:path*',  // AGREGAR esta línea
  ],
};
```

---

## PASO 3: CREAR ESTRUCTURA DE CARPETAS PARA VENDEDOR

**ACCIÓN**: CREAR nuevas carpetas

**COMANDOS A EJECUTAR**:

```bash
cd apps/web-admin

# Crear estructura de carpetas
mkdir -p app/\(vendedor\)/vendedor
mkdir -p app/\(vendedor\)/vendedor/pedidos/\[id\]
mkdir -p app/\(vendedor\)/vendedor/historico
mkdir -p hooks
mkdir -p lib
mkdir -p public/sounds
```

**RESULTADO ESPERADO**:
```
apps/web-admin/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/        ← Ya existe (admin/manager)
│   └── (vendedor)/         ← NUEVO
│       └── vendedor/
│           ├── layout.tsx
│           ├── page.tsx
│           ├── pedidos/
│           │   ├── page.tsx
│           │   └── [id]/
│           │       └── page.tsx
│           └── historico/
│               └── page.tsx
├── hooks/
│   └── useSellerNotifications.ts  ← NUEVO
├── lib/
│   └── socket.ts                   ← NUEVO
└── public/
    └── sounds/                     ← NUEVO
```

---

## PASO 4: CREAR LAYOUT DEL VENDEDOR

### Archivo: `apps/web-admin/app/(vendedor)/vendedor/layout.tsx`

**ACCIÓN**: CREAR archivo nuevo

**UBICACIÓN EXACTA**: `apps/web-admin/app/(vendedor)/vendedor/layout.tsx`

**CÓDIGO COMPLETO**:

```typescript
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingCart, Package, History, LogOut, Home } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function VendedorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Verificar autenticación y rol
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    // Solo vendedores pueden acceder
    if (session.user.role !== 'SELLER') {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const navigation = [
    {
      name: 'Início',
      href: '/vendedor',
      icon: Home,
      current: pathname === '/vendedor',
    },
    {
      name: 'Pedidos Online',
      href: '/vendedor/pedidos',
      icon: Package,
      current: pathname.startsWith('/vendedor/pedidos'),
    },
    {
      name: 'Histórico',
      href: '/vendedor/historico',
      icon: History,
      current: pathname === '/vendedor/historico',
    },
  ];

  // Mostrar loading mientras carga
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si no es vendedor, no mostrar nada (se redirigirá)
  if (session?.user.role !== 'SELLER') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Painel do Vendedor
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Olá, {session?.user?.name || 'Vendedor'}
              </p>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-3 py-4 text-sm font-medium border-b-2 transition
                    ${
                      item.current
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
```

---

## PASO 5: CREAR PÁGINA HOME DEL VENDEDOR

### Archivo: `apps/web-admin/app/(vendedor)/vendedor/page.tsx`

**ACCIÓN**: CREAR archivo nuevo

**UBICACIÓN EXACTA**: `apps/web-admin/app/(vendedor)/vendedor/page.tsx`

**QUÉ DEBE HACER ESTA PÁGINA**:
- Mostrar 4 cards con estadísticas del día (ventas, pedidos, ticket medio, items vendidos)
- Mostrar alerta si hay pedidos pendientes
- Mostrar lista de últimos 5 pedidos pendientes
- Tener botones de acceso rápido a "Pedidos" y "Nueva Venta"
- Auto-refrescar stats cada 30 segundos

**CÓDIGO COMPLETO**:

```typescript
'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { 
  ShoppingCart, 
  Package, 
  DollarSign, 
  TrendingUp,
  Clock,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

interface SellerStats {
  todaySales: number;
  todayOrders: number;
  averageTicket: number;
  itemsSold: number;
  pendingOrders: number;
  activeOrders: number;
}

interface PendingOrder {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
  };
  items: any[];
  total: number;
  createdAt: string;
  minutesAgo: number;
}

export default function VendedorHomePage() {
  const { data: session } = useSession();
  
  // Fetch de estadísticas
  const { data: stats, isLoading: statsLoading } = useQuery<SellerStats>({
    queryKey: ['seller-stats'],
    queryFn: async () => {
      const res = await fetch('/api/seller/stats');
      if (!res.ok) throw new Error('Error al cargar estadísticas');
      return res.json();
    },
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });

  // Fetch de pedidos pendientes (últimos 5)
  const { data: pendingOrders, isLoading: ordersLoading } = useQuery<PendingOrder[]>({
    queryKey: ['pending-orders-preview'],
    queryFn: async () => {
      const res = await fetch('/api/seller/orders/pending?limit=5');
      if (!res.ok) throw new Error('Error al cargar pedidos');
      return res.json();
    },
    refetchInterval: 10000, // Refrescar cada 10 segundos
  });

  // Cards de estadísticas
  const statCards = [
    {
      name: 'Vendas Hoje',
      value: `R$ ${(stats?.todaySales || 0).toFixed(2)}`,
      icon: DollarSign,
      bgColor: 'bg-green-500',
      textColor: 'text-green-600',
      lightBg: 'bg-green-50',
    },
    {
      name: 'Pedidos',
      value: stats?.todayOrders || 0,
      icon: ShoppingCart,
      bgColor: 'bg-blue-500',
      textColor: 'text-blue-600',
      lightBg: 'bg-blue-50',
    },
    {
      name: 'Ticket Médio',
      value: `R$ ${(stats?.averageTicket || 0).toFixed(2)}`,
      icon: TrendingUp,
      bgColor: 'bg-purple-500',
      textColor: 'text-purple-600',
      lightBg: 'bg-purple-50',
    },
    {
      name: 'Items Vendidos',
      value: stats?.itemsSold || 0,
      icon: Package,
      bgColor: 'bg-orange-500',
      textColor: 'text-orange-600',
      lightBg: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-3xl font-bold mt-2 text-gray-900">
                    {statsLoading ? '...' : stat.value}
                  </p>
                </div>
                <div className={`${stat.lightBg} p-3 rounded-lg`}>
                  <Icon className={stat.textColor} size={28} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alerta de Pedidos Pendentes */}
      {stats && stats.pendingOrders > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="text-yellow-600 mr-3 flex-shrink-0" size={24} />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  {stats.pendingOrders} pedido{stats.pendingOrders > 1 ? 's' : ''} aguardando preparação
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Clique para ver e começar a preparar
                </p>
              </div>
            </div>
            <Link
              href="/vendedor/pedidos"
              className="flex items-center gap-2 text-sm font-medium text-yellow-800 hover:text-yellow-900"
            >
              Ver Pedidos
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* Pedidos Pendentes Recentes */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Pedidos Pendentes</h2>
            {pendingOrders && pendingOrders.length > 0 && (
              <Link
                href="/vendedor/pedidos"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Ver todos
              </Link>
            )}
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {ordersLoading ? (
            <div className="px-6 py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Carregando pedidos...</p>
            </div>
          ) : pendingOrders && pendingOrders.length > 0 ? (
            pendingOrders.map((order) => (
              <Link
                key={order.id}
                href={`/vendedor/pedidos/${order.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Package className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Pedido #{order.orderNumber}</p>
                    <p className="text-sm text-gray-600">
                      {order.customer.name} • {order.items.length} items
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold text-gray-900">R$ {order.total.toFixed(2)}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-1 justify-end">
                    <Clock size={14} />
                    Há {order.minutesAgo} min
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <Package size={48} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 font-medium">Nenhum pedido pendente</p>
              <p className="text-sm text-gray-500 mt-1">
                Novos pedidos aparecerão aqui automaticamente
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/vendedor/pedidos"
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-8 hover:shadow-xl transition text-white group"
        >
          <Package className="mb-4 group-hover:scale-110 transition" size={40} />
          <h3 className="font-bold text-xl mb-2">Preparar Pedidos</h3>
          <p className="text-blue-100 text-sm">
            Ver e preparar pedidos online dos clientes
          </p>
        </Link>

        <div className="bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg shadow-lg p-8 text-white">
          <ShoppingCart className="mb-4 opacity-50" size={40} />
          <h3 className="font-bold text-xl mb-2 opacity-75">Nova Venda (Em breve)</h3>
          <p className="text-gray-200 text-sm opacity-75">
            POS para vendas presenciais no balcão
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## PASO 6: CREAR PÁGINA DE LISTA DE PEDIDOS

### Archivo: `apps/web-admin/app/(vendedor)/vendedor/pedidos/page.tsx`

**ACCIÓN**: CREAR archivo nuevo

**UBICACIÓN EXACTA**: `apps/web-admin/app/(vendedor)/vendedor/pedidos/page.tsx`

**QUÉ DEBE HACER ESTA PÁGINA**:
- Mostrar TODOS los pedidos pendientes y en preparación
- Tener filtros: Todos / Pendentes / Em Preparação
- Cada pedido debe mostrar: número, cliente, items, total, tiempo transcurrido, prioridad
- Cards clickeables que llevan al detalle del pedido
- Auto-refrescar cada 10 segundos

**CÓDIGO COMPLETO**:

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { Package, Clock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface Order {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    phone: string;
  };
  items: any[];
  total: number;
  status: string;
  createdAt: string;
  scheduledAt?: string;
  deliveryMethod: string;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  minutesAgo: number;
  pickedItemsCount?: number;
  totalItemsCount?: number;
}

export default function PedidosPage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'picking'>('all');

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['seller-orders', filter],
    queryFn: async () => {
      const res = await fetch(`/api/seller/orders?filter=${filter}`);
      if (!res.ok) throw new Error('Error al cargar pedidos');
      return res.json();
    },
    refetchInterval: 10000, // Refrescar cada 10 segundos
  });

  const priorityConfig = {
    NORMAL: {
      badge: 'bg-gray-100 text-gray-800',
      label: 'Normal',
    },
    HIGH: {
      badge: 'bg-orange-100 text-orange-800',
      label: 'Alta Prioridade',
    },
    URGENT: {
      badge: 'bg-red-100 text-red-800',
      label: 'Urgente',
    },
  };

  const deliveryConfig = {
    HOME_DELIVERY: '🏠 Entrega',
    STORE_PICKUP: '🏪 Retirada',
    EXPRESS_DELIVERY: '⚡ Express',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pedidos Online</h1>
        <p className="text-gray-600 mt-1">
          Gerencie e prepare os pedidos dos clientes
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'all'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'pending'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          Pendentes
        </button>
        <button
          onClick={() => setFilter('picking')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'picking'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          Em Preparação
        </button>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={40} />
          <p className="ml-3 text-gray-600">Carregando pedidos...</p>
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/vendedor/pedidos/${order.id}`}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-6 border border-gray-200"
            >
              <div className="flex items-start justify-between">
                {/* Left Side - Order Info */}
                <div className="flex-1">
                  {/* Header with Badge */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-100 p-2.5 rounded-lg">
                      <Package className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">
                        Pedido #{order.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {order.customer.name}
                      </p>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Items</p>
                      <p className="font-semibold text-gray-900">
                        {order.items.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Total</p>
                      <p className="font-semibold text-gray-900">
                        R$ {order.total.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Entrega</p>
                      <p className="font-semibold text-gray-900">
                        {deliveryConfig[order.deliveryMethod as keyof typeof deliveryConfig] || order.deliveryMethod}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Tempo</p>
                      <p className="font-semibold text-gray-900 flex items-center gap-1">
                        <Clock size={14} />
                        Há {order.minutesAgo} min
                      </p>
                    </div>
                  </div>

                  {/* Progress (si está en picking) */}
                  {order.status === 'PICKING' && order.pickedItemsCount !== undefined && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Progresso</span>
                        <span className="font-medium text-gray-900">
                          {order.pickedItemsCount}/{order.totalItemsCount} items
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${(order.pickedItemsCount / (order.totalItemsCount || 1)) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        priorityConfig[order.priority].badge
                      }`}
                    >
                      {priorityConfig[order.priority].label}
                    </span>
                    
                    {order.scheduledAt && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        ⏰ Agendado
                      </span>
                    )}

                    {order.status === 'PICKING' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        🔄 Em Preparação
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Side - Action Button */}
                <div className="ml-6">
                  <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm">
                    {order.status === 'PICKING' ? 'Continuar →' : 'Preparar →'}
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Tudo pronto!
          </h3>
          <p className="text-gray-600">
            Não há pedidos {filter === 'pending' ? 'pendentes' : filter === 'picking' ? 'em preparação' : ''} no momento
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## PASO 7: CREAR ENDPOINT DE STATS

### Archivo: `apps/backend/src/modules/seller/seller.controller.ts`

**ACCIÓN**: AGREGAR método o CREAR archivo si no existe

**UBICACIÓN**: `apps/backend/src/modules/seller/`

**INSTRUCCIONES**:
1. Si la carpeta `seller` no existe, crearla
2. Si `seller.controller.ts` no existe, crearlo
3. Agregar el endpoint GET `/api/seller/stats`

**CÓDIGO DEL CONTROLLER**:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Role } from '@prisma/client';
import { SellerService } from './seller.service';

@Controller('seller')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @Get('stats')
  @Roles(Role.SELLER, Role.ADMIN, Role.MANAGER)
  async getStats(@GetUser('id') userId: string) {
    return this.sellerService.getStats(userId);
  }
}
```

---

## PASO 8: CREAR SERVICE DE STATS

### Archivo: `apps/backend/src/modules/seller/seller.service.ts`

**ACCIÓN**: CREAR archivo nuevo

**CÓDIGO COMPLETO**:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfDay, addDays } from 'date-fns';

@Injectable()
export class SellerService {
  constructor(private prisma: PrismaService) {}

  async getStats(sellerId: string) {
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);

    // Ventas del vendedor hoy
    const sales = await this.prisma.order.findMany({
      where: {
        sellerId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          not: 'CANCELLED',
        },
      },
      include: {
        items: true,
      },
    });

    const todaySales = sales.reduce((sum, order) => sum + Number(order.total), 0);
    const todayOrders = sales.length;
    const itemsSold = sales.reduce(
      (sum, order) => sum + order.items.reduce((s, i) => s + i.quantity, 0),
      0
    );
    const averageTicket = todayOrders > 0 ? todaySales / todayOrders : 0;

    // Pedidos pendientes (no asignados o en picking)
    const pendingOrders = await this.prisma.order.count({
      where: {
        status: {
          in: ['CONFIRMED', 'PICKING'],
        },
      },
    });

    // Pedidos activos del vendedor
    const activeOrders = await this.prisma.order.count({
      where: {
        sellerId,
        status: 'PICKING',
      },
    });

    return {
      todaySales,
      todayOrders,
      averageTicket,
      itemsSold,
      pendingOrders,
      activeOrders,
    };
  }
}
```

---

## PASO 9: CREAR ENDPOINT DE PEDIDOS PENDIENTES

### Archivo: `apps/backend/src/modules/seller/seller.controller.ts`

**ACCIÓN**: AGREGAR al controller existente

**CÓDIGO A AGREGAR**:

```typescript
@Get('orders/pending')
@Roles(Role.SELLER, Role.ADMIN, Role.MANAGER)
async getPendingOrders(@Query('limit') limit?: string) {
  return this.sellerService.getPendingOrders(limit ? parseInt(limit) : undefined);
}

@Get('orders')
@Roles(Role.SELLER, Role.ADMIN, Role.MANAGER)
async getOrders(
  @CurrentUser('id') sellerId: string,
  @Query('filter') filter: string = 'all',
) {
  // make sure we pass the sellerId that is actually stored on the order row
  // (`order.sellerId`). filtering by some other value from the user record
  // (for example a separate "seller" property) will not work because the
  // two ids are not guaranteed to be the same.
  return this.sellerService.getOrders(sellerId, filter);
}
```

---

## PASO 10: AGREGAR MÉTODOS AL SERVICE

### Archivo: `apps/backend/src/modules/seller/seller.service.ts`

**ACCIÓN**: AGREGAR estos métodos al service existente

**CÓDIGO A AGREGAR**:

```typescript
async getPendingOrders(limit?: number) {
  const orders = await this.prisma.order.findMany({
    where: {
      status: {
        in: ['CONFIRMED', 'PICKING'],
      },
    },
    include: {
      customer: {
        select: {
          name: true,
          phone: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              name: true,
              barcode: true,
              imageUrl: true,
            },
          },
        },
      },
    },
    orderBy: [
      { scheduledAt: 'asc' },
      { createdAt: 'asc' },
    ],
    take: limit,
  });

  return orders.map((order) => ({
    ...order,
    priority: this.calculatePriority(order),
    minutesAgo: Math.floor(
      (new Date().getTime() - new Date(order.createdAt).getTime()) / 60000
    ),
  }));
}

async getOrders(sellerId: string, filter: string) {
  const statusFilter = filter === 'pending' 
    ? ['CONFIRMED'] 
    : filter === 'picking' 
    ? ['PROCESSING'] 
    : ['CONFIRMED', 'PROCESSING'];
  // only return orders that belong to the current seller, the column used in
  // the database is `order.sellerId` and it may contain a different uuid than
  // the user's primary id (this is the heart of the bug reported earlier)
  const orders = await this.prisma.order.findMany({
    where: {
      sellerId,
      status: {
        in: statusFilter,
      },
    },

  const orders = await this.prisma.order.findMany({
    where: {
      status: {
        in: statusFilter,
      },
    },
    include: {
      customer: {
        select: {
          name: true,
          phone: true,
        },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: [
      { scheduledAt: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  return orders.map((order) => {
    const pickedItems = order.items.filter((item: any) => item.status === 'PICKED').length;
    
    return {
      ...order,
      priority: this.calculatePriority(order),
      minutesAgo: Math.floor(
        (new Date().getTime() - new Date(order.createdAt).getTime()) / 60000
      ),
      pickedItemsCount: pickedItems,
      totalItemsCount: order.items.length,
    };
  });
}

private calculatePriority(order: any): 'NORMAL' | 'HIGH' | 'URGENT' {
  if (!order.scheduledAt) return 'NORMAL';

  const now = new Date();
  const hoursUntil =
    (new Date(order.scheduledAt).getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntil < 1) return 'URGENT';
  if (hoursUntil < 2) return 'HIGH';
  return 'NORMAL';
}
```

---

## PASO 11: REGISTRAR MODULE EN BACKEND

### Archivo: `apps/backend/src/app.module.ts`

**ACCIÓN**: AGREGAR SellerModule a los imports

**CÓDIGO A AGREGAR** (en el array de imports):

```typescript
import { SellerModule } from './modules/seller/seller.module';

@Module({
  imports: [
    // ... otros imports existentes
    SellerModule, // AGREGAR esta línea
  ],
  // ...
})
```

### Archivo: `apps/backend/src/modules/seller/seller.module.ts`

**ACCIÓN**: CREAR archivo nuevo

**CÓDIGO COMPLETO**:

```typescript
import { Module } from '@nestjs/common';
import { SellerController } from './seller.controller';
import { SellerService } from './seller.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SellerController],
  providers: [SellerService],
  exports: [SellerService],
})
export class SellerModule {}
```

---

## ✅ RESUMEN DE ARCHIVOS CREADOS/MODIFICADOS

### Archivos MODIFICADOS:
1. `apps/web-admin/app/(auth)/login/page.tsx` - Agregar redirección por rol
2. `apps/web-admin/middleware.ts` - Agregar protección de rutas
3. `apps/backend/src/app.module.ts` - Agregar SellerModule

### Archivos CREADOS:
1. `apps/web-admin/app/(vendedor)/vendedor/layout.tsx`
2. `apps/web-admin/app/(vendedor)/vendedor/page.tsx`
3. `apps/web-admin/app/(vendedor)/vendedor/pedidos/page.tsx`
4. `apps/backend/src/modules/seller/seller.module.ts`
5. `apps/backend/src/modules/seller/seller.controller.ts`
6. `apps/backend/src/modules/seller/seller.service.ts`

---

## 🚀 PRÓXIMOS PASOS (después de completar esto)

Una vez que todo lo anterior funcione, continuaremos con:
- Página de detalle del pedido con picking
- Sistema de escaneo de códigos de barras
- WebSocket para notificaciones en tiempo real
- Sonidos de notificación

---

## 🧪 CÓMO PROBAR

1. **Login como vendedor**:
   - Ir a `/login`
   - Entrar con credenciales de usuario con role='SELLER'
   - Debe redirigir a `/vendedor`

2. **Ver stats**:
   - Debe mostrar 4 cards con estadísticas
   - Debe auto-refrescar cada 30 segundos

3. **Ver pedidos pendientes**:
   - Ir a "Pedidos Online"
   - Debe mostrar lista de pedidos
   - Filtros deben funcionar

4. **Protección de rutas**:
   - Como vendedor, intentar ir a `/dashboard`
   - Debe redirigir de vuelta a `/vendedor`

---

## ❌ ERRORES COMUNES Y SOLUCIONES

### Error: "Cannot find module 'sonner'"
**Solución**: Instalar dependencia
```bash
cd apps/web-admin
pnpm add sonner
```

### Error: "SellerModule not found"
**Solución**: Verificar que:
1. Creaste `seller.module.ts`
2. Lo agregaste a `app.module.ts`
3. Reiniciaste el servidor del backend

### Error: "Redirect loop"
**Solución**: Verificar middleware - asegurarse de que:
1. No redirige si ya está en la ruta correcta
2. El matcher no incluye `/api/*`

---

## 📝 NOTAS FINALES

- Este es SOLO el inicio del dashboard del vendedor
- Faltan: detalle de pedido, picking, notificaciones en tiempo real
- Pero con esto ya tendrás la base funcionando
- Primero asegúrate de que esto funcione antes de continuar
