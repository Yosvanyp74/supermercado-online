import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (!socket) {
    // Connect to namespace /notifications, not path
    const baseUrl = process.env.EXPO_PUBLIC_WS_URL || 'http://localhost:3000';
    socket = io(baseUrl + '/notifications', {
      auth: { token },
      transports: ['websocket'],
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
