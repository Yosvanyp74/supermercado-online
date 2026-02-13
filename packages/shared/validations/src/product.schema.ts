import { z } from 'zod';

export const createProductSchema = z.object({
  sku: z.string().min(1, 'SKU é obrigatório'),
  barcode: z.string().optional(),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  categoryId: z.string().uuid('ID de categoria inválido'),
  brandId: z.string().uuid().optional(),
  price: z.number().positive('Preço deve ser positivo'),
  costPrice: z.number().positive().optional(),
  compareAtPrice: z.number().positive().optional(),
  stock: z.number().int().min(0, 'Estoque não pode ser negativo'),
  minStock: z.number().int().min(0).default(5),
  maxStock: z.number().int().positive().optional(),
  unit: z.string().default('un'),
  weight: z.number().positive().optional(),
  volume: z.number().positive().optional(),
  mainImageUrl: z.string().url().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED']).default('ACTIVE'),
  isFeatured: z.boolean().default(false),
  isOrganic: z.boolean().default(false),
  taxRate: z.number().min(0).max(100).default(0),
  tags: z.array(z.string()).optional(),
  aisleLocation: z.string().optional(),
  shelfPosition: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED']).optional(),
  isFeatured: z.coerce.boolean().optional(),
  isOrganic: z.coerce.boolean().optional(),
  sortBy: z.enum(['name', 'price', 'createdAt', 'stock']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
