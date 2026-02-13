export enum DeliveryStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RETURNED = 'RETURNED',
}

export interface Delivery {
  id: string;
  orderId: string;
  deliveryPersonId: string;
  status: DeliveryStatus;
  pickupAddress: DeliveryAddress;
  deliveryAddress: DeliveryAddress;
  estimatedTime?: number;
  actualTime?: number;
  distance?: number;
  currentLatitude?: number;
  currentLongitude?: number;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  failureReason?: string;
  rating?: number;
  ratingComment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
}

export interface DeliveryLocationUpdate {
  deliveryId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
}

export interface AssignDeliveryDto {
  orderId: string;
  deliveryPersonId: string;
}
