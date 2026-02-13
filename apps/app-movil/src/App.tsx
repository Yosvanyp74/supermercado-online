import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { AppNavigator } from '@/navigation';
import { useAuthStore } from '@/store';
import { Loading } from '@/components';
import { colors } from '@/theme';

export default function App() {
  const { isLoading, loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, []);

  if (isLoading) {
    return <Loading fullScreen message="Carregando..." />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer
          theme={{
            dark: false,
            colors: {
              primary: colors.primary[600],
              background: colors.background,
              card: colors.white,
              text: colors.foreground,
              border: colors.border,
              notification: colors.destructive,
            },
          }}
        >
          <StatusBar style="dark" />
          <AppNavigator />
        </NavigationContainer>
        <Toast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
