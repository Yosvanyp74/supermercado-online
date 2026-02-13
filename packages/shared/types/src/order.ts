export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum OrderType {
  ONLINE = 'ONLINE',
  IN_STORE = 'IN_STORE',
}

export enum FulfillmentType {
  DELIVERY = 'DELIVERY',
  PICKUP = 'PICKUP',
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  sellerId?: string;
  deliveryPersonId?: string;
  status: OrderStatus;
  type: OrderType;
  fulfillmentType: FulfillmentType;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  total: number;
  couponId?: string;
  deliveryAddressId?: string;
  deliveryAddress?: OrderDeliveryAddress;
  notes?: string;
  estimatedDeliveryTime?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  notes?: string;
  pickedAt?: Date;
  pickedBy?: string;
  isSubstituted: boolean;
  substitutedProductId?: string;
  substitutedProductName?: string;
}

export interface OrderDeliveryAddress {
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

export interface CreateOrderDto {
  items: CreateOrderItemDto[];
  fulfillmentType: FulfillmentType;
  deliveryAddressId?: string;
  couponCode?: string;
  notes?: string;
  paymentMethodId?: string;
}

export interface CreateOrderItemDto {
  productId: string;
  quantity: number;
  notes?: string;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  notes?: string;
}
