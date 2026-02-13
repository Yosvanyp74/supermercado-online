export enum NotificationType {
  ORDER_STATUS = 'ORDER_STATUS',
  DELIVERY_UPDATE = 'DELIVERY_UPDATE',
  PROMOTION = 'PROMOTION',
  LOYALTY = 'LOYALTY',
  SYSTEM = 'SYSTEM',
  NEW_ORDER = 'NEW_ORDER',
  LOW_STOCK = 'LOW_STOCK',
  PAYMENT = 'PAYMENT',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  orderUpdates: boolean;
  promotions: boolean;
  deliveryUpdates: boolean;
  loyaltyUpdates: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
}
