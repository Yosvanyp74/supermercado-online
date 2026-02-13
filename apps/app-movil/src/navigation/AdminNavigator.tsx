import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminStackParamList } from './types';
import { colors } from '@/theme';

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

const Stack = createNativeStackNavigator<AdminStackParamList>();

const adminScreenOptions = {
  headerStyle: { backgroundColor: colors.admin.primary },
  headerTintColor: colors.white,
  headerTitleStyle: { fontWeight: '600' as const },
  headerShadowVisible: false,
};

export function AdminNavigator() {
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
    </Stack.Navigator>
  );
}
