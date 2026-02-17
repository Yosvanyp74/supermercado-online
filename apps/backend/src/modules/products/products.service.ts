import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { PricingService } from '../pricing/pricing.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const productInclude = {
  category: { select: { id: true, name: true, slug: true } },
  brand: { select: { id: true, name: true, slug: true } },
  images: { orderBy: { position: Prisma.SortOrder.asc } },
};

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private uploadsService: UploadsService,
    private pricingService: PricingService,
  ) {}

  async findAll(params: {
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
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      page = 1,
      limit = 20,
      search,
      categoryId,
      brandId,
      minPrice,
      maxPrice,
      status,
      isFeatured,
      isOrganic,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;
    if (status) where.status = status;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (isOrganic !== undefined) where.isOrganic = isOrganic;

    // Exclude expired products from customer-facing queries (unless admin filters by specific status)
    if (!status) {
      where.status = { not: ProductStatus.EXPIRED };
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    const allowedSortFields = [
      'name',
      'price',
      'createdAt',
      'updatedAt',
      'salesCount',
      'viewCount',
      'stock',
    ];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: productInclude,
        skip,
        take: limit,
        orderBy: { [orderField]: sortOrder },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        ...productInclude,
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    return product;
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        ...productInclude,
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    return product;
  }

  async findByBarcode(barcode: string) {
    const product = await this.prisma.product.findUnique({
      where: { barcode },
      include: productInclude,
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado com este código de barras');
    }

    return product;
  }

  async create(dto: CreateProductDto) {
    // Check SKU uniqueness
    const existingSku = await this.prisma.product.findUnique({
      where: { sku: dto.sku },
    });
    if (existingSku) {
      throw new ConflictException('SKU já cadastrado');
    }

    // Check barcode uniqueness
    if (dto.barcode) {
      const existingBarcode = await this.prisma.product.findUnique({
        where: { barcode: dto.barcode },
      });
      if (existingBarcode) {
        throw new ConflictException('Código de barras já cadastrado');
      }
    }

    // Generate slug
    let slug = slugify(dto.name);
    const existingSlug = await this.prisma.product.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    // Auto-calculate price if costPrice and productRole are provided
    const createData: any = { ...dto, slug };
    if (dto.costPrice != null && dto.productRole) {
      const pricing = this.pricingService.calculatePrice(dto.costPrice, dto.productRole);
      if (pricing.finalPrice <= dto.costPrice) {
        throw new BadRequestException('Pricing calculation invalid: price below cost');
      }
      createData.price = pricing.finalPrice;
      createData.appliedMargin = pricing.appliedMargin;
      createData.pricingRuleVersion = pricing.ruleVersion;
      createData.compareAtPrice = undefined; // auto-priced → no manual compare
    } else if (dto.costPrice != null && !dto.productRole) {
      throw new BadRequestException('Rol estratégico é obrigatório quando o custo é informado');
    }

    const product = await this.prisma.product.create({
      data: createData,
      include: productInclude,
    });

    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!existing) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Delete old main image if it changed
    if (dto.mainImageUrl && dto.mainImageUrl !== existing.mainImageUrl) {
      this.uploadsService.deleteFile(existing.mainImageUrl);
    }

    // Check SKU uniqueness if changed
    if (dto.sku && dto.sku !== existing.sku) {
      const existingSku = await this.prisma.product.findUnique({
        where: { sku: dto.sku },
      });
      if (existingSku) {
        throw new ConflictException('SKU já cadastrado');
      }
    }

    // Check barcode uniqueness if changed
    if (dto.barcode && dto.barcode !== existing.barcode) {
      const existingBarcode = await this.prisma.product.findUnique({
        where: { barcode: dto.barcode },
      });
      if (existingBarcode) {
        throw new ConflictException('Código de barras já cadastrado');
      }
    }

    // Regenerate slug if name changed
    const data: any = { ...dto };
    if (dto.name && dto.name !== existing.name) {
      let slug = slugify(dto.name);
      const existingSlug = await this.prisma.product.findUnique({
        where: { slug },
      });
      if (existingSlug && existingSlug.id !== id) {
        slug = `${slug}-${Date.now()}`;
      }
      data.slug = slug;
    }

    // Auto-recalculate price if cost or role changed
    const effectiveCost = dto.costPrice ?? existing.costPrice;
    const effectiveRole = dto.productRole ?? existing.productRole;
    if (effectiveCost != null && effectiveRole) {
      const pricing = this.pricingService.calculatePrice(effectiveCost, effectiveRole);
      if (pricing.finalPrice <= effectiveCost) {
        throw new BadRequestException('Pricing calculation invalid: price below cost');
      }
      data.price = pricing.finalPrice;
      data.appliedMargin = pricing.appliedMargin;
      data.pricingRuleVersion = pricing.ruleVersion;
    }

    const product = await this.prisma.product.update({
      where: { id },
      data,
      include: productInclude,
    });

    return product;
  }

  async remove(id: string) {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!existing) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Delete all associated image files
    this.uploadsService.deleteFile(existing.mainImageUrl);
    for (const img of existing.images) {
      this.uploadsService.deleteFile(img.url);
    }

    await this.prisma.product.delete({
      where: { id },
    });

    return { message: 'Produto removido com sucesso' };
  }

  async findFeatured(limit = 20) {
    const products = await this.prisma.product.findMany({
      where: {
        isFeatured: true,
        status: ProductStatus.ACTIVE,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: productInclude,
      take: limit,
      orderBy: { salesCount: 'desc' },
    });

    return products;
  }

  async search(query: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.ACTIVE,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { shortDescription: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
        { tags: { has: query } },
      ],
      AND: [
        { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      ],
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: productInclude,
        skip,
        take: limit,
        orderBy: { salesCount: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
