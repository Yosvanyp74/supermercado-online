# Web Cliente - Next.js

## Contexto del Proyecto
Aplicación web para clientes del supermercado con experiencia optimizada para desktop y móvil, SEO-friendly y con server-side rendering.

## Objetivos de la Web
- Experiencia de compra fluida y rápida
- SEO optimizado para productos
- Rendimiento excelente (Core Web Vitals)
- Responsive design (mobile-first)
- PWA capabilities
- Accesibilidad (WCAG 2.1)

## Stack Tecnológico
- **Framework**: Next.js 14+ (App Router)
- **React**: 18+
- **TypeScript**: 5+
- **Estilos**: Tailwind CSS + Shadcn/ui
- **Estado**: Zustand / Redux Toolkit
- **Formularios**: React Hook Form + Zod
- **HTTP**: TanStack Query (React Query)
- **Auth**: NextAuth.js
- **Pagos**: Stripe / MercadoPago SDK
- **Analytics**: Google Analytics / Vercel Analytics
- **SEO**: Next.js Metadata API
- **Testing**: Vitest + Testing Library

## Estructura del Proyecto

```
web-client/
├── app/                        # App Router (Next.js 14+)
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (shop)/
│   │   ├── page.tsx            # Home
│   │   ├── products/
│   │   │   ├── page.tsx        # Lista de productos
│   │   │   ├── [slug]/
│   │   │   │   └── page.tsx    # Detalle de producto
│   │   │   └── category/
│   │   │       └── [slug]/
│   │   │           └── page.tsx
│   │   ├── cart/
│   │   │   └── page.tsx
│   │   ├── checkout/
│   │   │   ├── page.tsx
│   │   │   ├── shipping/
│   │   │   │   └── page.tsx
│   │   │   ├── payment/
│   │   │   │   └── page.tsx
│   │   │   └── confirmation/
│   │   │       └── page.tsx
│   │   ├── search/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (account)/
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   ├── orders/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── addresses/
│   │   │   └── page.tsx
│   │   ├── payment-methods/
│   │   │   └── page.tsx
│   │   ├── wishlist/
│   │   │   └── page.tsx
│   │   ├── loyalty/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── about/
│   │   └── page.tsx
│   ├── contact/
│   │   └── page.tsx
│   ├── api/                    # API Routes
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   └── webhooks/
│   │       └── stripe/
│   │           └── route.ts
│   ├── layout.tsx              # Root layout
│   ├── loading.tsx
│   ├── error.tsx
│   └── not-found.tsx
├── components/
│   ├── ui/                     # Shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── select.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Navigation.tsx
│   │   ├── MobileMenu.tsx
│   │   └── SearchBar.tsx
│   ├── product/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductFilters.tsx
│   │   ├── ProductSort.tsx
│   │   ├── ProductGallery.tsx
│   │   ├── ProductInfo.tsx
│   │   ├── ProductReviews.tsx
│   │   └── RelatedProducts.tsx
│   ├── cart/
│   │   ├── CartItem.tsx
│   │   ├── CartSummary.tsx
│   │   ├── CartDrawer.tsx
│   │   └── EmptyCart.tsx
│   ├── checkout/
│   │   ├── CheckoutSteps.tsx
│   │   ├── ShippingForm.tsx
│   │   ├── PaymentForm.tsx
│   │   └── OrderSummary.tsx
│   ├── account/
│   │   ├── OrderCard.tsx
│   │   ├── OrderTimeline.tsx
│   │   ├── AddressCard.tsx
│   │   └── AddressForm.tsx
│   ├── home/
│   │   ├── HeroSlider.tsx
│   │   ├── CategoryGrid.tsx
│   │   ├── FeaturedProducts.tsx
│   │   ├── DealsSection.tsx
│   │   └── Newsletter.tsx
│   └── common/
│       ├── Loading.tsx
│       ├── ErrorMessage.tsx
│       ├── Pagination.tsx
│       ├── Breadcrumbs.tsx
│       └── SEO.tsx
├── lib/
│   ├── api/
│   │   ├── client.ts           # Axios instance
│   │   ├── products.ts
│   │   ├── cart.ts
│   │   ├── orders.ts
│   │   ├── auth.ts
│   │   └── user.ts
│   ├── validations/
│   │   ├── auth.ts
│   │   ├── checkout.ts
│   │   └── profile.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── constants.ts
│   │   └── helpers.ts
│   └── hooks/
│       ├── useCart.ts
│       ├── useAuth.ts
│       ├── useDebounce.ts
│       └── useLocalStorage.ts
├── store/
│   ├── cart-store.ts           # Zustand store
│   ├── auth-store.ts
│   └── ui-store.ts
├── types/
│   ├── api.ts
│   ├── models.ts
│   └── index.ts
├── styles/
│   └── globals.css
├── public/
│   ├── images/
│   ├── icons/
│   └── favicon.ico
├── middleware.ts               # Auth middleware
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Páginas Principales

### 1. Home (`/`)
**Componentes:**
- Hero slider con ofertas destacadas
- Grid de categorías principales
- Productos destacados
- Ofertas del día
- Newsletter signup
- Beneficios (envío gratis, garantía, etc)

**SEO:**
```typescript
export const metadata: Metadata = {
  title: 'Supermercado Online - Compra todo lo que necesitas',
  description: 'Compra productos frescos, abarrotes y más con entrega a domicilio',
  keywords: ['supermercado online', 'entrega a domicilio', 'productos frescos'],
  openGraph: {
    title: 'Supermercado Online',
    description: 'Compra todo lo que necesitas',
    images: ['/og-image.jpg'],
  },
};
```

### 2. Productos (`/products`)
**Features:**
- Grid de productos con lazy loading
- Filtros sidebar:
  - Categorías
  - Rango de precio
  - Marcas
  - Etiquetas (orgánico, oferta, etc)
- Ordenamiento (precio, popularidad, nombre)
- Búsqueda
- Paginación

**SSR para SEO:**
```typescript
async function ProductsPage({ searchParams }: Props) {
  const products = await getProducts(searchParams);
  
  return (
    <div className="container mx-auto">
      <ProductFilters />
      <ProductGrid products={products} />
      <Pagination />
    </div>
  );
}
```

### 3. Detalle de Producto (`/products/[slug]`)
**Features:**
- Galería de imágenes con zoom
- Información completa del producto
- Selector de cantidad
- Botón agregar al carrito
- Tabs: Descripción, Información nutricional, Reseñas
- Productos relacionados
- Breadcrumbs

**Metadata dinámica:**
```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.slug);
  
  return {
    title: `${product.name} - Supermercado Online`,
    description: product.description,
    openGraph: {
      images: [product.mainImageUrl],
    },
  };
}
```

### 4. Carrito (`/cart`)
**Features:**
- Lista de productos en carrito
- Actualizar cantidades
- Eliminar productos
- Aplicar cupones
- Resumen de precios
- Botón continuar a checkout
- Productos sugeridos

### 5. Checkout (`/checkout`)
**Flujo multi-paso:**

#### Paso 1: Información de envío
- Seleccionar dirección guardada o agregar nueva
- Información de contacto
- Método de entrega (domicilio, pickup, express)
- Fecha/hora preferida

#### Paso 2: Pago
- Seleccionar método de pago
- Formulario de tarjeta (Stripe/MercadoPago)
- Guardar método de pago
- Aplicar cupones

#### Paso 3: Confirmación
- Resumen completo
- Términos y condiciones
- Botón finalizar compra

### 6. Cuenta (`/account/...`)

#### Perfil (`/account/profile`)
- Editar información personal
- Cambiar contraseña
- Preferencias

#### Órdenes (`/account/orders`)
- Lista de órdenes (tabs: activas/completadas)
- Detalle de orden
- Tracking
- Re-ordenar
- Descargar factura

#### Direcciones (`/account/addresses`)
- Lista de direcciones
- CRUD de direcciones
- Marcar como predeterminada

#### Métodos de Pago (`/account/payment-methods`)
- Lista de tarjetas guardadas
- Agregar/eliminar

#### Wishlist (`/account/wishlist`)
- Productos guardados
- Mover a carrito
- Compartir wishlist

#### Programa de Lealtad (`/account/loyalty`)
- Balance de puntos
- Historial
- Recompensas disponibles
- Canjear puntos

### 7. Búsqueda (`/search`)
**Features:**
- Búsqueda en tiempo real
- Autocompletado
- Sugerencias
- Filtros
- Historial de búsquedas

## Componentes Principales

### Header
```typescript
export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white shadow">
      <div className="container mx-auto">
        {/* Top bar: contacto, ayuda */}
        <TopBar />
        
        {/* Main header */}
        <div className="flex items-center justify-between py-4">
          <Logo />
          <SearchBar />
          <div className="flex items-center gap-4">
            <WishlistButton />
            <CartButton />
            <UserMenu />
          </div>
        </div>
        
        {/* Navigation */}
        <Navigation categories={categories} />
      </div>
    </header>
  );
}
```

### ProductCard
```typescript
interface ProductCardProps {
  product: Product;
  variant?: 'grid' | 'list';
}

export function ProductCard({ product, variant = 'grid' }: ProductCardProps) {
  const { addToCart } = useCart();
  
  return (
    <Card className={cn('product-card', variant)}>
      <Link href={`/products/${product.slug}`}>
        <div className="relative">
          <Image
            src={product.mainImageUrl}
            alt={product.name}
            width={300}
            height={300}
            className="object-cover"
          />
          {product.discount && (
            <Badge className="absolute top-2 right-2">
              -{product.discount}%
            </Badge>
          )}
        </div>
        
        <CardContent>
          <h3 className="font-semibold">{product.name}</h3>
          <div className="flex items-center justify-between">
            <div>
              {product.compareAtPrice && (
                <span className="line-through text-muted-foreground">
                  ${product.compareAtPrice}
                </span>
              )}
              <span className="text-lg font-bold">
                ${product.price}
              </span>
            </div>
            <Button
              onClick={(e) => {
                e.preventDefault();
                addToCart(product);
              }}
            >
              Agregar
            </Button>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
```

### CartDrawer
```typescript
export function CartDrawer() {
  const { items, total, removeItem, updateQuantity } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="relative">
          <ShoppingCart />
          {items.length > 0 && (
            <Badge className="absolute -top-2 -right-2">
              {items.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Carrito de Compras</SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col h-full">
          <ScrollArea className="flex-1">
            {items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </ScrollArea>
          
          <div className="border-t pt-4">
            <div className="flex justify-between mb-4">
              <span className="font-semibold">Total:</span>
              <span className="text-2xl font-bold">${total}</span>
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={() => router.push('/checkout')}
            >
              Ir al Checkout
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

## Estado Global - Zustand

### Cart Store
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product) => set((state) => {
        const existingItem = state.items.find(item => item.id === product.id);
        
        if (existingItem) {
          return {
            items: state.items.map(item =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          };
        }
        
        return {
          items: [...state.items, { ...product, quantity: 1 }],
        };
      }),
      
      removeItem: (productId) => set((state) => ({
        items: state.items.filter(item => item.id !== productId),
      })),
      
      updateQuantity: (productId, quantity) => set((state) => ({
        items: state.items.map(item =>
          item.id === productId ? { ...item, quantity } : item
        ),
      })),
      
      clearCart: () => set({ items: [] }),
      
      get total() {
        return get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
```

## Data Fetching - TanStack Query

### Configuración:
```typescript
// app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minuto
      cacheTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### Hooks personalizados:
```typescript
// hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/lib/api/products';

export function useProducts(params: ProductParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => getProducts(params),
  });
}

// hooks/useProduct.ts
export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => getProduct(slug),
  });
}
```

## Autenticación - NextAuth.js

### Configuración:
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { login } from '@/lib/api/auth';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const user = await login(credentials.email, credentials.password);
        if (user) {
          return user;
        }
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user.role = token.role;
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
});

export { handler as GET, handler as POST };
```

### Middleware de protección:
```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      // Proteger rutas de cuenta
      if (req.nextUrl.pathname.startsWith('/account')) {
        return !!token;
      }
      return true;
    },
  },
});

export const config = {
  matcher: ['/account/:path*', '/checkout/:path*'],
};
```

## Formularios - React Hook Form + Zod

### Ejemplo de checkout:
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const shippingSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  address: z.string().min(5),
  city: z.string().min(2),
  zipCode: z.string().min(5),
});

type ShippingFormData = z.infer<typeof shippingSchema>;

export function ShippingForm() {
  const form = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
  });

  const onSubmit = async (data: ShippingFormData) => {
    // Guardar información de envío
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Más campos... */}
        <Button type="submit">Continuar</Button>
      </form>
    </Form>
  );
}
```

## Pagos - Stripe / MercadoPago

### Stripe Elements:
```typescript
'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY);

export function PaymentForm() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
```

## SEO Optimization

### Metadata estática:
```typescript
export const metadata: Metadata = {
  title: 'Título de la página',
  description: 'Descripción',
  keywords: ['keyword1', 'keyword2'],
  openGraph: {
    title: 'Título OG',
    description: 'Descripción OG',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
  },
};
```

### Structured Data (JSON-LD):
```typescript
export function ProductStructuredData({ product }: Props) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.mainImageUrl,
    description: product.description,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'MXN',
      availability: product.stock > 0 
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.averageRating,
      reviewCount: product.reviewCount,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
```

## PWA Configuration

### manifest.json:
```json
{
  "name": "Supermercado Online",
  "short_name": "Supermercado",
  "description": "Tu supermercado en línea",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## Performance Optimization

### Image Optimization:
```typescript
import Image from 'next/image';

<Image
  src={product.imageUrl}
  alt={product.name}
  width={400}
  height={400}
  loading="lazy"
  placeholder="blur"
  blurDataURL={product.thumbnailUrl}
/>
```

### Dynamic Imports:
```typescript
const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <Loading />,
  ssr: false,
});
```

## Pasos de Implementación

### Fase 1: Setup (Semana 1)
1. Inicializar Next.js 14
2. Configurar Tailwind + Shadcn/ui
3. Setup TypeScript
4. Configurar estructura de carpetas

### Fase 2: Layout y Navegación (Semana 1-2)
1. Header/Footer
2. Navegación principal
3. Mobile menu
4. Breadcrumbs

### Fase 3: Autenticación (Semana 2)
1. NextAuth.js setup
2. Login/Register pages
3. Protected routes

### Fase 4: Productos (Semana 2-4)
1. Home page
2. Product listing
3. Product detail
4. Filtros y búsqueda

### Fase 5: Carrito y Checkout (Semana 4-5)
1. Cart functionality
2. Checkout flow
3. Payment integration

### Fase 6: Cuenta de Usuario (Semana 5-6)
1. Profile pages
2. Orders history
3. Addresses
4. Wishlist

### Fase 7: SEO y Performance (Semana 6-7)
1. Metadata optimization
2. Structured data
3. Image optimization
4. Core Web Vitals

### Fase 8: Testing y Deploy (Semana 7-8)
1. Unit tests
2. E2E tests
3. Deploy a Vercel
4. Analytics setup

## Recursos Útiles

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn/ui](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query)
- [NextAuth.js](https://next-auth.js.org/)
