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
  markAllAsRead: () => void;
  clearNotifications: () => void;
  getUnreadCount: () => number;
  getUnreadNotifications: () => Notification[];
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
  })),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    ),
  })),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, read: true })),
  })),
  clearNotifications: () => set({ notifications: [] }),
  getUnreadCount: () => get().notifications.filter((n) => !n.read).length,
  getUnreadNotifications: () => get().notifications.filter((n) => !n.read),
}));
