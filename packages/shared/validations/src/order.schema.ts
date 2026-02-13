import { z } from 'zod';

export const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive('Quantidade deve ser positiva'),
    notes: z.string().optional(),
  })).min(1, 'Pedido deve ter pelo menos 1 item'),
  fulfillmentType: z.enum(['DELIVERY', 'PICKUP']),
  deliveryAddressId: z.string().uuid().optional(),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
  paymentMethodId: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING', 'CONFIRMED', 'PROCESSING',
    'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY',
    'DELIVERED', 'CANCELLED', 'REFUNDED',
  ]),
  notes: z.string().optional(),
});

export const createSaleSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().positive('Quantidade deve ser positiva'),
    unitPrice: z.number().positive('Preço deve ser positivo'),
    discount: z.number().min(0).default(0),
  })).min(1, 'Venda deve ter pelo menos 1 item'),
  customerId: z.string().uuid().optional(),
  discount: z.number().min(0).default(0),
  paymentMethod: z.enum(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'TRANSFER']),
  paidAmount: z.number().positive().optional(),
  notes: z.string().optional(),
});

export const addToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive('Quantidade deve ser positiva'),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive('Quantidade deve ser positiva'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
