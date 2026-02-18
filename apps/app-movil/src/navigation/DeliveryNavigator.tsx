import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DeliveryStackParamList } from './types';
import { useTheme } from '@/theme';

import { DeliveryHomeScreen } from '@/screens/delivery/DeliveryHomeScreen';
import { DeliveryAvailableOrdersScreen } from '@/screens/delivery/DeliveryAvailableOrdersScreen';
import { DeliveryActiveScreen } from '@/screens/delivery/DeliveryActiveScreen';
import { DeliveryDetailScreen } from '@/screens/delivery/DeliveryDetailScreen';
import { DeliveryHistoryScreen } from '@/screens/delivery/DeliveryHistoryScreen';
import { DeliveryProfileScreen } from '@/screens/delivery/DeliveryProfileScreen';

const Stack = createNativeStackNavigator<DeliveryStackParamList>();

export function DeliveryNavigator() {
  const { colors } = useTheme();
  const deliveryScreenOptions = {
    headerStyle: { backgroundColor: colors.delivery.primary },
    headerTintColor: '#ffffff',
    headerTitleStyle: { fontWeight: '600' as const },
    headerShadowVisible: false,
  };
  return (
    <Stack.Navigator screenOptions={deliveryScreenOptions}>
      <Stack.Screen
        name="DeliveryHome"
        component={DeliveryHomeScreen}
        options={{ title: 'Modo Entregador' }}
      />
      <Stack.Screen
        name="DeliveryAvailableOrders"
        component={DeliveryAvailableOrdersScreen}
        options={{ title: 'Pedidos Disponíveis' }}
      />
      <Stack.Screen
        name="DeliveryActive"
        component={DeliveryActiveScreen}
        options={{ title: 'Entregas Ativas' }}
      />
      <Stack.Screen
        name="DeliveryDetail"
        component={DeliveryDetailScreen}
        options={{ title: 'Detalhes da Entrega' }}
      />
      <Stack.Screen
        name="DeliveryHistory"
        component={DeliveryHistoryScreen}
        options={{ title: 'Histórico de Entregas' }}
      />
      <Stack.Screen
        name="DeliveryProfile"
        component={DeliveryProfileScreen}
        options={{ title: 'Meu Perfil' }}
      />
    </Stack.Navigator>
  );
}
