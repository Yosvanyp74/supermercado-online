export enum CouponType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FREE_SHIPPING = 'FREE_SHIPPING',
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  type: CouponType;
  value: number;
  minOrderValue?: number;
  maxDiscountValue?: number;
  maxUses?: number;
  currentUses: number;
  maxUsesPerUser?: number;
  isActive: boolean;
  startsAt?: Date;
  expiresAt?: Date;
  categoryIds?: string[];
  productIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCouponDto {
  code: string;
  description?: string;
  type: CouponType;
  value: number;
  minOrderValue?: number;
  maxDiscountValue?: number;
  maxUses?: number;
  maxUsesPerUser?: number;
  startsAt?: Date;
  expiresAt?: Date;
  categoryIds?: string[];
  productIds?: string[];
}

export interface ValidateCouponDto {
  code: string;
  orderTotal: number;
  items: { productId: string; categoryId: string; quantity: number; total: number }[];
}

export interface CouponValidationResult {
  isValid: boolean;
  discount: number;
  message?: string;
}
