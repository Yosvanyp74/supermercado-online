import { create } from 'zustand';

export interface Notification {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  data?: any;
  read?: boolean;
}

interface NotificationsState {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
  })),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    ),
  })),
  clearNotifications: () => set({ notifications: [] }),
}));
