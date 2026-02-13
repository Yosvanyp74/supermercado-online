# App Móvil - React Native

## Contexto del Proyecto
App móvil para clientes y repartidores del supermercado con todas las funcionalidades necesarias para navegar productos, realizar compras y hacer seguimiento de pedidos.

## Objetivos de la App
- Experiencia de usuario fluida y nativa
- Catálogo completo de productos con búsqueda
- Carrito de compras y checkout
- Seguimiento de pedidos en tiempo real
- Notificaciones push
- Perfil de usuario y direcciones
- Programa de lealtad
- Modo repartidor para delivery

## Stack Tecnológico
- **Framework**: React Native (0.73+)
- **Navegación**: React Navigation 6
- **Estado Global**: Redux Toolkit + RTK Query
- **Formularios**: React Hook Form
- **Validación**: Yup / Zod
- **HTTP Client**: Axios / RTK Query
- **WebSockets**: Socket.io-client
- **Notificaciones**: React Native Firebase
- **Mapas**: React Native Maps
- **Imágenes**: React Native Fast Image
- **Storage**: AsyncStorage / MMKV
- **Animaciones**: React Native Reanimated
- **UI Components**: React Native Paper / NativeBase / Custom
- **Testing**: Jest + React Native Testing Library

## Estructura del Proyecto

```
mobile/
├── src/
│   ├── api/                    # API calls y configuración
│   │   ├── client.ts           # Axios instance
│   │   ├── endpoints/
│   │   │   ├── auth.ts
│   │   │   ├── products.ts
│   │   │   ├── orders.ts
│   │   │   ├── cart.ts
│   │   │   └── user.ts
│   │   └── socket.ts           # WebSocket configuration
│   ├── components/             # Componentes reutilizables
│   │   ├── common/
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Card/
│   │   │   ├── Loading/
│   │   │   └── ErrorBoundary/
│   │   ├── product/
│   │   │   ├── ProductCard/
│   │   │   ├── ProductList/
│   │   │   ├── ProductFilter/
│   │   │   └── ProductDetail/
│   │   ├── cart/
│   │   │   ├── CartItem/
│   │   │   ├── CartSummary/
│   │   │   └── EmptyCart/
│   │   └── order/
│   │       ├── OrderCard/
│   │       ├── OrderTimeline/
│   │       └── OrderTracking/
│   ├── screens/                # Pantallas principales
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   ├── ForgotPasswordScreen.tsx
│   │   │   └── VerifyEmailScreen.tsx
│   │   ├── main/
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── CategoriesScreen.tsx
│   │   │   ├── SearchScreen.tsx
│   │   │   └── DealsScreen.tsx
│   │   ├── product/
│   │   │   ├── ProductListScreen.tsx
│   │   │   ├── ProductDetailScreen.tsx
│   │   │   └── ProductReviewsScreen.tsx
│   │   ├── cart/
│   │   │   ├── CartScreen.tsx
│   │   │   └── CheckoutScreen.tsx
│   │   ├── orders/
│   │   │   ├── OrdersScreen.tsx
│   │   │   ├── OrderDetailScreen.tsx
│   │   │   └── TrackOrderScreen.tsx
│   │   ├── profile/
│   │   │   ├── ProfileScreen.tsx
│   │   │   ├── EditProfileScreen.tsx
│   │   │   ├── AddressesScreen.tsx
│   │   │   ├── PaymentMethodsScreen.tsx
│   │   │   └── SettingsScreen.tsx
│   │   ├── loyalty/
│   │   │   ├── LoyaltyScreen.tsx
│   │   │   └── RewardsScreen.tsx
│   │   └── delivery/           # Para repartidores
│   │       ├── DeliveryHomeScreen.tsx
│   │       ├── ActiveDeliveriesScreen.tsx
│   │       └── DeliveryDetailScreen.tsx
│   ├── navigation/             # Configuración de navegación
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── MainNavigator.tsx
│   │   ├── DeliveryNavigator.tsx
│   │   └── types.ts
│   ├── store/                  # Redux store
│   │   ├── index.ts
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── cartSlice.ts
│   │   │   ├── userSlice.ts
│   │   │   └── appSlice.ts
│   │   └── services/           # RTK Query services
│   │       ├── authApi.ts
│   │       ├── productsApi.ts
│   │       ├── ordersApi.ts
│   │       └── cartApi.ts
│   ├── hooks/                  # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useCart.ts
│   │   ├── useDebounce.ts
│   │   ├── useLocation.ts
│   │   └── useNotifications.ts
│   ├── utils/                  # Utilidades
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   ├── storage.ts
│   │   └── constants.ts
│   ├── types/                  # TypeScript types
│   │   ├── api.ts
│   │   ├── models.ts
│   │   └── navigation.ts
│   ├── theme/                  # Tema y estilos
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── index.ts
│   ├── services/               # Servicios externos
│   │   ├── notifications.ts
│   │   ├── location.ts
│   │   ├── analytics.ts
│   │   └── payment.ts
│   └── App.tsx
├── android/
├── ios/
├── __tests__/
├── package.json
├── tsconfig.json
├── metro.config.js
├── babel.config.js
└── app.json
```

## Navegación - React Navigation

### Stack Principal

```typescript
type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Delivery: undefined;
};

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyEmail: { email: string };
};

type MainTabParamList = {
  Home: undefined;
  Categories: undefined;
  Cart: undefined;
  Orders: undefined;
  Profile: undefined;
};

type HomeStackParamList = {
  HomeScreen: undefined;
  ProductList: { categoryId?: string; search?: string };
  ProductDetail: { productId: string };
  ProductReviews: { productId: string };
  Search: undefined;
};
```

### Navegadores a implementar:

1. **Root Navigator** (Stack)
   - AuthNavigator
   - MainNavigator
   - DeliveryNavigator

2. **Auth Navigator** (Stack)
   - Login
   - Register
   - ForgotPassword
   - VerifyEmail

3. **Main Navigator** (Bottom Tabs)
   - Home (Stack)
   - Categories (Stack)
   - Cart (Stack)
   - Orders (Stack)
   - Profile (Stack)

4. **Delivery Navigator** (para repartidores)
   - DeliveryHome
   - ActiveDeliveries
   - DeliveryDetail

## Pantallas Principales

### 1. Autenticación

#### LoginScreen
- Email y password
- Botón "Recordarme"
- Login con biometría
- Link a registro
- Link a recuperar contraseña

#### RegisterScreen
- Formulario completo
- Validación en tiempo real
- Términos y condiciones
- Verificación de email

### 2. Home

#### HomeScreen
- Banner de promociones
- Categorías destacadas
- Productos destacados
- Ofertas del día
- Productos más vendidos
- Búsqueda rápida

### 3. Productos

#### ProductListScreen
- Lista de productos con scroll infinito
- Filtros (categoría, precio, marca)
- Ordenamiento
- Búsqueda
- Vista grid/lista

#### ProductDetailScreen
- Galería de imágenes
- Información completa
- Precio y descuentos
- Botón agregar al carrito
- Cantidad selector
- Productos relacionados
- Reseñas y calificaciones
- Información nutricional

### 4. Carrito

#### CartScreen
- Lista de productos en carrito
- Modificar cantidades
- Eliminar productos
- Subtotal, impuestos, delivery
- Cupones/descuentos
- Botón checkout

#### CheckoutScreen
- Selección de dirección
- Método de entrega
- Fecha/hora de entrega
- Método de pago
- Resumen de orden
- Confirmación

### 5. Órdenes

#### OrdersScreen
- Tabs: Activas / Completadas
- Lista de órdenes
- Estados visuales
- Botón re-ordenar

#### OrderDetailScreen
- Detalles completos
- Timeline de estados
- Productos ordenados
- Información de pago
- Información de entrega
- Botón cancelar (si aplica)

#### TrackOrderScreen
- Mapa con ubicación del repartidor
- Tiempo estimado
- Contacto con repartidor
- Estado actual

### 6. Perfil

#### ProfileScreen
- Información del usuario
- Opciones:
  - Editar perfil
  - Mis direcciones
  - Métodos de pago
  - Puntos de lealtad
  - Notificaciones
  - Configuración
  - Ayuda
  - Cerrar sesión

#### AddressesScreen
- Lista de direcciones guardadas
- Agregar nueva dirección
- Editar/eliminar
- Marcar como predeterminada
- Selector de mapa

### 7. Búsqueda

#### SearchScreen
- Búsqueda con autocompletado
- Búsquedas recientes
- Filtros rápidos
- Resultados en tiempo real

### 8. Modo Repartidor

#### DeliveryHomeScreen
- Estado online/offline
- Estadísticas del día
- Entregas pendientes
- Historial

#### ActiveDeliveriesScreen
- Lista de entregas activas
- Navegación a destino
- Marcar como recogido/entregado

## Estado Global - Redux

### Slices principales:

#### authSlice
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}
```

#### cartSlice
```typescript
interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  appliedCoupon: Coupon | null;
  loading: boolean;
}
```

#### userSlice
```typescript
interface UserState {
  profile: UserProfile | null;
  addresses: Address[];
  paymentMethods: PaymentMethod[];
  preferences: UserPreferences;
}
```

#### appSlice
```typescript
interface AppState {
  isOnline: boolean;
  location: Location | null;
  notifications: Notification[];
  settings: AppSettings;
}
```

## RTK Query Services

### Ejemplo: productsApi

```typescript
export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Products'],
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: (params) => ({
        url: '/products',
        params,
      }),
      providesTags: ['Products'],
    }),
    getProductById: builder.query({
      query: (id) => `/products/${id}`,
    }),
    searchProducts: builder.query({
      query: (searchTerm) => ({
        url: '/products/search',
        params: { q: searchTerm },
      }),
    }),
  }),
});
```

## WebSockets - Socket.io

### Conexión y eventos:

```typescript
import io from 'socket.io-client';

const socket = io(SOCKET_URL, {
  auth: {
    token: userToken,
  },
});

// Eventos a escuchar
socket.on('notification:new', (notification) => {
  // Mostrar notificación
});

socket.on('order:status', (orderUpdate) => {
  // Actualizar estado de orden
});

socket.on('delivery:location', (location) => {
  // Actualizar ubicación en mapa
});
```

## Notificaciones Push

### Configuración con Firebase:

```typescript
import messaging from '@react-native-firebase/messaging';

// Solicitar permisos
async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
  }
}

// Obtener token
async function getFCMToken() {
  const fcmToken = await messaging().getToken();
  // Enviar token al backend
}

// Escuchar notificaciones en foreground
messaging().onMessage(async remoteMessage => {
  // Mostrar notificación local
});

// Escuchar notificaciones en background
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
});
```

## Storage Local

### AsyncStorage para datos persistentes:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Guardar token
export const saveToken = async (token: string) => {
  await AsyncStorage.setItem('auth_token', token);
};

// Obtener token
export const getToken = async () => {
  return await AsyncStorage.getItem('auth_token');
};

// Guardar carrito (offline)
export const saveCart = async (cart: CartItem[]) => {
  await AsyncStorage.setItem('cart', JSON.stringify(cart));
};
```

## Formularios - React Hook Form

### Ejemplo de formulario de login:

```typescript
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().min(8).required(),
});

function LoginScreen() {
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = (data) => {
    // Login logic
  };

  return (
    <View>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder="Email"
          />
        )}
      />
      {errors.email && <Text>{errors.email.message}</Text>}
      
      <Button onPress={handleSubmit(onSubmit)} title="Login" />
    </View>
  );
}
```

## Componentes Principales

### ProductCard
```typescript
interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onAddToCart: () => void;
}
```

### CartItem
```typescript
interface CartItemProps {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}
```

### OrderCard
```typescript
interface OrderCardProps {
  order: Order;
  onPress: () => void;
  onTrack: () => void;
}
```

## Mapas y Geolocalización

### React Native Maps:

```typescript
import MapView, { Marker } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';

// Obtener ubicación actual
Geolocation.getCurrentPosition(
  (position) => {
    const { latitude, longitude } = position.coords;
    // Usar coordenadas
  },
  (error) => console.log(error),
  { enableHighAccuracy: true }
);

// Mostrar mapa con marcador
<MapView
  style={styles.map}
  initialRegion={{
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  }}
>
  <Marker
    coordinate={{ latitude: 37.78825, longitude: -122.4324 }}
    title="Mi ubicación"
  />
</MapView>
```

## Optimización de Imágenes

### React Native Fast Image:

```typescript
import FastImage from 'react-native-fast-image';

<FastImage
  style={{ width: 200, height: 200 }}
  source={{
    uri: product.imageUrl,
    priority: FastImage.priority.normal,
  }}
  resizeMode={FastImage.resizeMode.cover}
/>
```

## Animaciones

### React Native Reanimated:

```typescript
import Animated, { 
  useSharedValue, 
  useAnimatedStyle,
  withSpring 
} from 'react-native-reanimated';

function AddToCartButton() {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const onPress = () => {
    scale.value = withSpring(1.2, {}, () => {
      scale.value = withSpring(1);
    });
    // Add to cart logic
  };

  return (
    <Animated.View style={animatedStyle}>
      <Button onPress={onPress} title="Agregar al Carrito" />
    </Animated.View>
  );
}
```

## Testing

### Jest + React Native Testing Library:

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import ProductCard from '../ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    price: 10.99,
    imageUrl: 'https://example.com/image.jpg',
  };

  it('renders product information correctly', () => {
    const { getByText } = render(
      <ProductCard product={mockProduct} onPress={jest.fn()} />
    );
    
    expect(getByText('Test Product')).toBeTruthy();
    expect(getByText('$10.99')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <ProductCard product={mockProduct} onPress={onPress} />
    );
    
    fireEvent.press(getByTestId('product-card'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

## Features Importantes

### 1. Modo Offline
- Detectar estado de conexión
- Almacenar carrito offline
- Sincronizar al volver online
- Mostrar mensajes apropiados

### 2. Deep Linking
- Abrir producto desde notificación
- Compartir productos
- Enlaces desde web

### 3. Búsqueda con Debounce
```typescript
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
```

### 4. Pull to Refresh
```typescript
<FlatList
  data={products}
  renderItem={renderProduct}
  refreshControl={
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={onRefresh}
    />
  }
/>
```

### 5. Infinite Scroll
```typescript
<FlatList
  data={products}
  renderItem={renderProduct}
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
  ListFooterComponent={isLoadingMore ? <Loading /> : null}
/>
```

## Configuraciones Importantes

### package.json dependencies principales:
```json
{
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.73.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/bottom-tabs": "^6.5.0",
    "@react-navigation/stack": "^6.3.0",
    "@reduxjs/toolkit": "^2.0.0",
    "react-redux": "^9.0.0",
    "react-hook-form": "^7.49.0",
    "yup": "^1.3.0",
    "@react-native-firebase/app": "^19.0.0",
    "@react-native-firebase/messaging": "^19.0.0",
    "socket.io-client": "^4.6.0",
    "axios": "^1.6.0",
    "react-native-maps": "^1.10.0",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "react-native-fast-image": "^8.6.3",
    "react-native-reanimated": "^3.6.0"
  }
}
```

## Pasos de Implementación

### Fase 1: Setup (Semana 1)
1. Inicializar proyecto React Native
2. Configurar navegación básica
3. Setup Redux Toolkit
4. Configurar TypeScript
5. Theme y diseño base

### Fase 2: Autenticación (Semana 1-2)
1. Pantallas de auth
2. Integración con API
3. Persistencia de token
4. Guards de navegación

### Fase 3: Productos y Catálogo (Semana 2-3)
1. Home screen
2. Product list y detail
3. Búsqueda
4. Filtros y categorías

### Fase 4: Carrito y Checkout (Semana 3-4)
1. Cart screen
2. Checkout flow
3. Integración de pagos
4. Confirmación de orden

### Fase 5: Órdenes y Tracking (Semana 4-5)
1. Orders screen
2. Order detail
3. Track order con mapa
4. WebSocket integration

### Fase 6: Perfil y Configuración (Semana 5-6)
1. Profile screens
2. Addresses management
3. Payment methods
4. Settings

### Fase 7: Features Avanzadas (Semana 6-7)
1. Push notifications
2. Loyalty program
3. Reviews y ratings
4. Wishlist

### Fase 8: Modo Repartidor (Semana 7-8)
1. Delivery screens
2. GPS tracking
3. Update delivery status

### Fase 9: Optimización (Semana 8-9)
1. Performance optimization
2. Offline mode
3. Caching
4. Animaciones

### Fase 10: Testing y Deploy (Semana 9-10)
1. Tests completos
2. Beta testing
3. App Store / Play Store setup
4. Deployment

## Recursos Útiles

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [React Native Firebase](https://rnfirebase.io/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
