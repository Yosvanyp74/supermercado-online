// Seller-specific types for POS and Order Picking

export interface Sale {
  id: string;
  orderNumber: string;
  sellerId: string;
  customerId?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  paidAmount: number;
  change: number;
  notes?: string;
  isSuspended: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  barcode?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface CreateSaleDto {
  items: CreateSaleItemDto[];
  customerId?: string;
  discount?: number;
  paymentMethod: string;
  paidAmount?: number;
  notes?: string;
}

export interface CreateSaleItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

// Order Picking types
export enum PickingStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  PICKING = 'PICKING',
  PICKED = 'PICKED',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface PickingItem {
  id: string;
  orderItemId: string;
  productId: string;
  productName: string;
  productImage?: string;
  barcode?: string;
  quantity: number;
  pickedQuantity: number;
  isPicked: boolean;
  aisleLocation?: string;
  shelfPosition?: string;
  pickedAt?: Date;
  notes?: string;
}

export interface PickingOrder {
  id: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  sellerId?: string;
  status: PickingStatus;
  items: PickingItem[];
  totalItems: number;
  pickedItems: number;
  progress: number;
  fulfillmentType: string;
  assignedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface SellerStats {
  todaySales: number;
  todayOrders: number;
  averageTicket: number;
  itemsSold: number;
  goalProgress: number;
  pendingPickingOrders: number;
}
