export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED',
}

export interface Product {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  categoryId: string;
  brandId?: string;
  price: number;
  costPrice?: number;
  compareAtPrice?: number;
  stock: number;
  minStock: number;
  maxStock?: number;
  unit: string;
  weight?: number;
  volume?: number;
  mainImageUrl?: string;
  images: ProductImage[];
  status: ProductStatus;
  isFeatured: boolean;
  isOrganic: boolean;
  taxRate: number;
  tags: string[];
  aisleLocation?: string;
  shelfPosition?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  position: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductDto {
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  shortDescription?: string;
  categoryId: string;
  brandId?: string;
  price: number;
  costPrice?: number;
  compareAtPrice?: number;
  stock: number;
  minStock?: number;
  maxStock?: number;
  unit?: string;
  weight?: number;
  volume?: number;
  mainImageUrl?: string;
  status?: ProductStatus;
  isFeatured?: boolean;
  isOrganic?: boolean;
  taxRate?: number;
  tags?: string[];
  aisleLocation?: string;
  shelfPosition?: string;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: ProductStatus;
  isFeatured?: boolean;
  isOrganic?: boolean;
  sortBy?: 'name' | 'price' | 'createdAt' | 'stock';
  sortOrder?: 'asc' | 'desc';
}
