export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
  TRANSFER = 'TRANSFER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  paidAmount?: number;
  change?: number;
  transactionId?: string;
  pixCode?: string;
  pixQrCode?: string;
  cardLastFour?: string;
  cardBrand?: string;
  receiptUrl?: string;
  paidAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcessPaymentDto {
  orderId: string;
  method: PaymentMethod;
  amount: number;
  paidAmount?: number;
  cardToken?: string;
}

export interface RefundPaymentDto {
  reason: string;
  amount?: number;
}
