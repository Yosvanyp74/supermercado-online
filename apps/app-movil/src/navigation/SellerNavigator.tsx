import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SellerStackParamList } from './types';
import { colors } from '@/theme';

import { SellerHomeScreen } from '@/screens/seller/SellerHomeScreen';
import { ProductScannerScreen } from '@/screens/seller/ProductScannerScreen';
import { ActiveSaleScreen } from '@/screens/seller/ActiveSaleScreen';
import { CustomerSearchScreen } from '@/screens/seller/CustomerSearchScreen';
import { PaymentScreen } from '@/screens/seller/PaymentScreen';
import { PaymentSuccessScreen } from '@/screens/seller/PaymentSuccessScreen';
import { SalesHistoryScreen } from '@/screens/seller/SalesHistoryScreen';
import { SuspendedSalesScreen } from '@/screens/seller/SuspendedSalesScreen';
import { OrderQueueScreen } from '@/screens/seller/OrderQueueScreen';
import { OrderPickingScreen } from '@/screens/seller/OrderPickingScreen';
import { BarcodeScannerPickingScreen } from '@/screens/seller/BarcodeScannerPickingScreen';
import { ManualItemPickScreen } from '@/screens/seller/ManualItemPickScreen';
import { OrderCompletionScreen } from '@/screens/seller/OrderCompletionScreen';
import { ReadyForDeliveryScreen } from '@/screens/seller/ReadyForDeliveryScreen';

const Stack = createNativeStackNavigator<SellerStackParamList>();

const sellerScreenOptions = {
  headerStyle: { backgroundColor: colors.seller.primary },
  headerTintColor: colors.white,
  headerTitleStyle: { fontWeight: '600' as const },
  headerShadowVisible: false,
};

export function SellerNavigator() {
  return (
    <Stack.Navigator screenOptions={sellerScreenOptions}>
      <Stack.Screen
        name="SellerHome"
        component={SellerHomeScreen}
        options={{ title: 'PDV Móvel' }}
      />
      <Stack.Screen
        name="ProductScanner"
        component={ProductScannerScreen}
        options={{ title: 'Escanear Produto' }}
      />
      <Stack.Screen
        name="ActiveSale"
        component={ActiveSaleScreen}
        options={{ title: 'Venda Ativa' }}
      />
      <Stack.Screen
        name="CustomerSearch"
        component={CustomerSearchScreen}
        options={{ title: 'Buscar Cliente' }}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ title: 'Pagamento' }}
      />
      <Stack.Screen
        name="PaymentSuccess"
        component={PaymentSuccessScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SalesHistory"
        component={SalesHistoryScreen}
        options={{ title: 'Histórico de Vendas' }}
      />
      <Stack.Screen
        name="SuspendedSales"
        component={SuspendedSalesScreen}
        options={{ title: 'Vendas Suspensas' }}
      />
      <Stack.Screen
        name="OrderQueue"
        component={OrderQueueScreen}
        options={{ title: 'Fila de Pedidos' }}
      />
      <Stack.Screen
        name="OrderPicking"
        component={OrderPickingScreen}
        options={{ title: 'Separação de Pedido' }}
      />
      <Stack.Screen
        name="BarcodeScannerPicking"
        component={BarcodeScannerPickingScreen}
        options={{ title: 'Escanear Item' }}
      />
      <Stack.Screen
        name="ManualItemPick"
        component={ManualItemPickScreen}
        options={{ title: 'Separação Manual' }}
      />
      <Stack.Screen
        name="OrderCompletion"
        component={OrderCompletionScreen}
        options={{ title: 'Pedido Finalizado' }}
      />
      <Stack.Screen
        name="ReadyForDelivery"
        component={ReadyForDeliveryScreen}
        options={{ title: 'Prontos para Entrega' }}
      />
    </Stack.Navigator>
  );
}
