import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  Home,
  Grid3X3,
  ShoppingCart,
  Package,
  User,
} from 'lucide-react-native';
import { colors } from '@/theme';
import { useCartStore } from '@/store';
import {
  MainTabParamList,
  HomeStackParamList,
  CategoriesStackParamList,
  CartStackParamList,
  OrdersStackParamList,
  ProfileStackParamList,
} from './types';

// Screens
import { HomeScreen } from '@/screens/main/HomeScreen';
import { ProductListScreen } from '@/screens/main/ProductListScreen';
import { ProductDetailScreen } from '@/screens/main/ProductDetailScreen';
import { SearchScreen } from '@/screens/main/SearchScreen';
import { CategoriesScreen } from '@/screens/main/CategoriesScreen';
import { CartScreen } from '@/screens/main/CartScreen';
import { CheckoutScreen } from '@/screens/main/CheckoutScreen';
import { OrdersScreen } from '@/screens/main/OrdersScreen';
import { OrderDetailScreen } from '@/screens/main/OrderDetailScreen';
import { TrackOrderScreen } from '@/screens/main/TrackOrderScreen';
import { ProfileScreen } from '@/screens/main/ProfileScreen';
import { EditProfileScreen } from '@/screens/main/EditProfileScreen';
import { AddressesScreen } from '@/screens/main/AddressesScreen';
import { AddAddressScreen } from '@/screens/main/AddAddressScreen';
import { WishlistScreen } from '@/screens/main/WishlistScreen';
import { LoyaltyScreen } from '@/screens/main/LoyaltyScreen';
import { NotificationsScreen } from '@/screens/main/NotificationsScreen';
import { View, Text, StyleSheet } from 'react-native';

// Stack Navigators
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const CategoriesStack = createNativeStackNavigator<CategoriesStackParamList>();
const CartStack = createNativeStackNavigator<CartStackParamList>();
const OrdersStack = createNativeStackNavigator<OrdersStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const defaultScreenOptions = {
  headerStyle: { backgroundColor: colors.white },
  headerTintColor: colors.foreground,
  headerTitleStyle: { fontWeight: '600' as const },
  headerShadowVisible: false,
};

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={defaultScreenOptions}>
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="ProductList"
        component={ProductListScreen}
        options={({ route }) => ({
          title: route.params?.title || 'Produtos',
        })}
      />
      <HomeStack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ title: '' }}
      />
      <HomeStack.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: 'Buscar' }}
      />
    </HomeStack.Navigator>
  );
}

function CategoriesStackNavigator() {
  return (
    <CategoriesStack.Navigator screenOptions={defaultScreenOptions}>
      <CategoriesStack.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{ title: 'Categorias' }}
      />
      <CategoriesStack.Screen
        name="CategoryProducts"
        component={ProductListScreen as any}
        options={({ route }) => ({
          title: route.params?.categoryName || 'Produtos',
        })}
      />
      <CategoriesStack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ title: '' }}
      />
    </CategoriesStack.Navigator>
  );
}

function CartStackNavigator() {
  return (
    <CartStack.Navigator screenOptions={defaultScreenOptions}>
      <CartStack.Screen
        name="Cart"
        component={CartScreen}
        options={{ title: 'Carrinho' }}
      />
      <CartStack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: 'Finalizar Pedido' }}
      />
    </CartStack.Navigator>
  );
}

function OrdersStackNavigator() {
  return (
    <OrdersStack.Navigator screenOptions={defaultScreenOptions}>
      <OrdersStack.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ title: 'Meus Pedidos' }}
      />
      <OrdersStack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: 'Detalhes do Pedido' }}
      />
      <OrdersStack.Screen
        name="TrackOrder"
        component={TrackOrderScreen}
        options={{ title: 'Rastrear Pedido' }}
      />
    </OrdersStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={defaultScreenOptions}>
      <ProfileStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Minha Conta' }}
      />
      <ProfileStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Editar Perfil' }}
      />
      <ProfileStack.Screen
        name="Addresses"
        component={AddressesScreen}
        options={{ title: 'Meus Endereços' }}
      />
      <ProfileStack.Screen
        name="AddAddress"
        component={AddAddressScreen}
        options={{ title: 'Adicionar Endereço' }}
      />
      <ProfileStack.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{ title: 'Lista de Desejos' }}
      />
      <ProfileStack.Screen
        name="Loyalty"
        component={LoyaltyScreen}
        options={{ title: 'Programa de Fidelidade' }}
      />
      <ProfileStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notificações' }}
      />
    </ProfileStack.Navigator>
  );
}

function CartBadge() {
  const totalItems = useCartStore((s) => s.totalItems());
  if (totalItems === 0) return null;
  return (
    <View style={badgeStyles.container}>
      <Text style={badgeStyles.text}>{totalItems > 99 ? '99+' : totalItems}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: -6,
    top: -4,
    backgroundColor: colors.destructive,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  text: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
});

export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.gray[400],
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.gray[100],
          paddingBottom: 4,
          height: 56,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="CategoriesTab"
        component={CategoriesStackNavigator}
        options={{
          tabBarLabel: 'Categorias',
          tabBarIcon: ({ color, size }) => <Grid3X3 size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartStackNavigator}
        options={{
          tabBarLabel: 'Carrinho',
          tabBarIcon: ({ color, size }) => (
            <View>
              <ShoppingCart size={size} color={color} />
              <CartBadge />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStackNavigator}
        options={{
          tabBarLabel: 'Pedidos',
          tabBarIcon: ({ color, size }) => <Package size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
