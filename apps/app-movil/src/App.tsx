import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { AppNavigator } from '@/navigation';
import { useAuthStore, useThemeStore } from '@/store';
import { Loading } from '@/components';
import { ThemeProvider, useTheme } from '@/theme';

function AppContent() {
  const { isLoading, loadUser } = useAuthStore();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    loadUser();
  }, []);

  if (isLoading) {
    return <Loading fullScreen message="Carregando..." />;
  }

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: colors.primary[600],
          background: colors.background,
          card: colors.card,
          text: colors.foreground,
          border: colors.border,
          notification: colors.destructive,
        },
      }}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  const { loadTheme } = useThemeStore();

  useEffect(() => {
    loadTheme();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
        <Toast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
