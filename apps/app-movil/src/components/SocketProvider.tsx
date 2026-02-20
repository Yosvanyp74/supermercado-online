import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { authApi } from '@/api';
import { decode as jwtDecode } from 'base-64';

interface SocketContextValue {
  socket: ReturnType<typeof getSocket> | null;
}

const SocketContext = createContext<SocketContextValue>({ socket: null });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [socket, setSocket] = useState<ReturnType<typeof getSocket> | null>(null);
  const isMounted = useRef(true);


  // Obtiene un token válido, refrescando si es necesario
  // Decodifica el JWT y retorna true si está expirado
  const isTokenExpired = (token: string | null) => {
    if (!token) return true;
    try {
      const [, payload] = token.split('.');
      const decoded = JSON.parse(jwtDecode(payload));
      if (!decoded.exp) return false;
      const now = Math.floor(Date.now() / 1000);
      return decoded.exp < now;
    } catch {
      return true;
    }
  };

  const getValidToken = async () => {
    let token = await SecureStore.getItemAsync('auth_token');
    const refreshToken = await SecureStore.getItemAsync('refresh_token');
    if ((!token || isTokenExpired(token)) && refreshToken) {
      // Token ausente o expirado, intenta refrescar
      try {
        const { data } = await authApi.refreshToken(refreshToken);
        await SecureStore.setItemAsync('auth_token', data.accessToken);
        if (data.refreshToken) {
          await SecureStore.setItemAsync('refresh_token', data.refreshToken);
        }
        token = data.accessToken;
      } catch (e) {
        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync('refresh_token');
        token = null;
      }
    }
    return token;
  };

  useEffect(() => {
    isMounted.current = true;
    (async () => {
      const validToken = await getValidToken();
      console.log('[SocketProvider] Token obtenido:', validToken);
      setToken(validToken || null);
    })();
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!token) {
      console.log('[SocketProvider] No hay token, no se inicializa socket');
      return;
    }
    console.log('[SocketProvider] Inicializando socket con token:', token);
    const s = getSocket(token);
    setSocket(s);

    // Suscripción global para orderStatusChanged
    const handleOrderStatusChanged = (payload: any) => {
      console.log('[SocketProvider] orderStatusChanged recibido:', payload);
      // Mostrar Toast global
      if (payload?.title || payload?.body) {
        // Lazy import para evitar ciclo
        import('react-native-toast-message').then(({ default: Toast }) => {
          Toast.show({
            type: 'info',
            text1: payload?.title || 'Pedido atualizado',
            text2: payload?.body || 'O status do seu pedido mudou.',
          });
        });
      }
    };
    s.on('orderStatusChanged', handleOrderStatusChanged);
    return () => {
      s.off('orderStatusChanged', handleOrderStatusChanged);
      disconnectSocket();
      setSocket(null);
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export function useSocket() {
  return useContext(SocketContext).socket;
}
