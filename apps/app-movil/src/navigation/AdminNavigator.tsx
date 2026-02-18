import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminStackParamList } from './types';
import { useTheme } from '@/theme';

import { AdminHomeScreen } from '@/screens/admin/AdminHomeScreen';
import { AdminProductsScreen } from '@/screens/admin/AdminProductsScreen';
import { AdminProductFormScreen } from '@/screens/admin/AdminProductFormScreen';
import { AdminCategoriesScreen } from '@/screens/admin/AdminCategoriesScreen';
import { AdminCategoryFormScreen } from '@/screens/admin/AdminCategoryFormScreen';
import { AdminOrdersScreen } from '@/screens/admin/AdminOrdersScreen';
import { AdminOrderDetailScreen } from '@/screens/admin/AdminOrderDetailScreen';
import { AdminUsersScreen } from '@/screens/admin/AdminUsersScreen';
import { AdminUserDetailScreen } from '@/screens/admin/AdminUserDetailScreen';
import { AdminInventoryScreen } from '@/screens/admin/AdminInventoryScreen';
import { AdminInventoryAdjustScreen } from '@/screens/admin/AdminInventoryAdjustScreen';
import { AdminCouponsScreen } from '@/screens/admin/AdminCouponsScreen';
import { AdminCouponFormScreen } from '@/screens/admin/AdminCouponFormScreen';
import { AdminAnalyticsScreen } from '@/screens/admin/AdminAnalyticsScreen';
import { AdminDeliveriesScreen } from '@/screens/admin/AdminDeliveriesScreen';
import { AdminDeliveryDetailScreen } from '@/screens/admin/AdminDeliveryDetailScreen';
import { AdminSuppliersScreen } from '@/screens/admin/AdminSuppliersScreen';
import { AdminSupplierFormScreen } from '@/screens/admin/AdminSupplierFormScreen';
import { AdminPurchaseOrdersScreen } from '@/screens/admin/AdminPurchaseOrdersScreen';
import { AdminReviewsScreen } from '@/screens/admin/AdminReviewsScreen';
import { AdminNotificationsScreen } from '@/screens/admin/AdminNotificationsScreen';
import { AdminSettingsScreen } from '@/screens/admin/AdminSettingsScreen';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export function AdminNavigator() {
  const { colors } = useTheme();
  const adminScreenOptions = {
    headerStyle: { backgroundColor: colors.admin.primary },
    headerTintColor: '#ffffff',
    headerTitleStyle: { fontWeight: '600' as const },
    headerShadowVisible: false,
  };
  return (
    <Stack.Navigator screenOptions={adminScreenOptions}>
      <Stack.Screen
        name="AdminHome"
        component={AdminHomeScreen}
        options={{ title: 'Administração' }}
      />
      <Stack.Screen
        name="AdminProducts"
        component={AdminProductsScreen}
        options={{ title: 'Produtos' }}
      />
      <Stack.Screen
        name="AdminProductForm"
        component={AdminProductFormScreen}
        options={({ route }) => ({
          title: route.params?.productId ? 'Editar Produto' : 'Novo Produto',
        })}
      />
      <Stack.Screen
        name="AdminCategories"
        component={AdminCategoriesScreen}
        options={{ title: 'Categorias' }}
      />
      <Stack.Screen
        name="AdminCategoryForm"
        component={AdminCategoryFormScreen}
        options={({ route }) => ({
          title: route.params?.categoryId ? 'Editar Categoria' : 'Nova Categoria',
        })}
      />
      <Stack.Screen
        name="AdminOrders"
        component={AdminOrdersScreen}
        options={{ title: 'Pedidos' }}
      />
      <Stack.Screen
        name="AdminOrderDetail"
        component={AdminOrderDetailScreen}
        options={{ title: 'Detalhes do Pedido' }}
      />
      <Stack.Screen
        name="AdminUsers"
        component={AdminUsersScreen}
        options={{ title: 'Usuários' }}
      />
      <Stack.Screen
        name="AdminUserDetail"
        component={AdminUserDetailScreen}
        options={{ title: 'Detalhes do Usuário' }}
      />
      <Stack.Screen
        name="AdminInventory"
        component={AdminInventoryScreen}
        options={{ title: 'Estoque' }}
      />
      <Stack.Screen
        name="AdminInventoryAdjust"
        component={AdminInventoryAdjustScreen}
        options={{ title: 'Ajustar Estoque' }}
      />
      <Stack.Screen
        name="AdminCoupons"
        component={AdminCouponsScreen}
        options={{ title: 'Cupons' }}
      />
      <Stack.Screen
        name="AdminCouponForm"
        component={AdminCouponFormScreen}
        options={({ route }) => ({
          title: route.params?.couponId ? 'Editar Cupom' : 'Novo Cupom',
        })}
      />
      <Stack.Screen
        name="AdminAnalytics"
        component={AdminAnalyticsScreen}
        options={{ title: 'Analytics' }}
      />
      <Stack.Screen
        name="AdminDeliveries"
        component={AdminDeliveriesScreen}
        options={{ title: 'Entregas' }}
      />
      <Stack.Screen
        name="AdminDeliveryDetail"
        component={AdminDeliveryDetailScreen}
        options={{ title: 'Detalhes da Entrega' }}
      />
      <Stack.Screen
        name="AdminSuppliers"
        component={AdminSuppliersScreen}
        options={{ title: 'Fornecedores' }}
      />
      <Stack.Screen
        name="AdminSupplierForm"
        component={AdminSupplierFormScreen}
        options={({ route }) => ({
          title: route.params?.supplierId ? 'Editar Fornecedor' : 'Novo Fornecedor',
        })}
      />
      <Stack.Screen
        name="AdminPurchaseOrders"
        component={AdminPurchaseOrdersScreen}
        options={{ title: 'Ordens de Compra' }}
      />
      <Stack.Screen
        name="AdminReviews"
        component={AdminReviewsScreen}
        options={{ title: 'Avaliações' }}
      />
      <Stack.Screen
        name="AdminNotifications"
        component={AdminNotificationsScreen}
        options={{ title: 'Notificações' }}
      />
      <Stack.Screen
        name="AdminSettings"
        component={AdminSettingsScreen}
        options={{ title: 'Configurações' }}
      />
    </Stack.Navigator>
  );
}
