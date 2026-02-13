import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { useAuthStore } from '@/store';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { SellerNavigator } from './SellerNavigator';
import { AdminNavigator } from './AdminNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { isAuthenticated, isSeller, isAdmin } = useAuthStore();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainNavigator} />
          {isSeller && (
            <Stack.Screen name="Seller" component={SellerNavigator} />
          )}
          {isAdmin && (
            <Stack.Screen name="Admin" component={AdminNavigator} />
          )}
        </>
      )}
    </Stack.Navigator>
  );
}
