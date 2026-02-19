import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { getSocket, disconnectSocket } from '@/lib/socket';

interface SocketContextValue {
  socket: ReturnType<typeof getSocket> | null;
}

const SocketContext = createContext<SocketContextValue>({ socket: null });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [socket, setSocket] = useState<ReturnType<typeof getSocket> | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    SecureStore.getItemAsync('auth_token').then((t) => {
      setToken(t || null);
    });
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!token) return;
    const s = getSocket(token);
    setSocket(s);
    return () => {
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
