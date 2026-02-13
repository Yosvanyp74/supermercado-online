import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, InventoryMovementType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';

const productStockSelect = {
  id: true,
  sku: true,
  name: true,
  stock: true,
  minStock: true,
  maxStock: true,
  unit: true,
  mainImageUrl: true,
  status: true,
  category: { select: { id: true, name: true } },
};

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getStock(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: productStockSelect,
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    return {
      ...product,
      isLowStock: product.stock < product.minStock,
    };
  }

  async getInventory(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    lowStock?: boolean;
  }) {
    const { page = 1, limit = 20, search, categoryId, lowStock } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    // For lowStock filter, we need a raw where clause
    const rawLowStockCondition = lowStock
      ? Prisma.sql`AND p."stock" < p."min_stock"`
      : Prisma.sql``;

    if (lowStock) {
      // Use raw query for low stock filter (field-to-field comparison)
      const countResult = await this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::int as count FROM products p
        WHERE 1=1
        ${categoryId ? Prisma.sql`AND p."category_id" = ${categoryId}` : Prisma.sql``}
        ${search ? Prisma.sql`AND (p."name" ILIKE ${'%' + search + '%'} OR p."sku" ILIKE ${'%' + search + '%'})` : Prisma.sql``}
        ${rawLowStockCondition}
      `;

      const total = Number(countResult[0].count);

      const products = await this.prisma.$queryRaw<any[]>`
        SELECT p."id", p."sku", p."name", p."stock", p."min_stock" as "minStock",
               p."max_stock" as "maxStock", p."unit", p."main_image_url" as "mainImageUrl",
               p."status", p."category_id" as "categoryId",
               c."id" as "category_id", c."name" as "categoryName"
        FROM products p
        LEFT JOIN categories c ON c."id" = p."category_id"
        WHERE 1=1
        ${categoryId ? Prisma.sql`AND p."category_id" = ${categoryId}` : Prisma.sql``}
        ${search ? Prisma.sql`AND (p."name" ILIKE ${'%' + search + '%'} OR p."sku" ILIKE ${'%' + search + '%'})` : Prisma.sql``}
        ${rawLowStockCondition}
        ORDER BY p."stock" ASC
        LIMIT ${limit} OFFSET ${skip}
      `;

      const data = products.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        stock: p.stock,
        minStock: p.minStock,
        maxStock: p.maxStock,
        unit: p.unit,
        mainImageUrl: p.mainImageUrl,
        status: p.status,
        category: { id: p.categoryId, name: p.categoryName },
        isLowStock: p.stock < p.minStock,
      }));

      return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: productStockSelect,
        skip,
        take: limit,
        orderBy: { stock: 'asc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: data.map((p) => ({ ...p, isLowStock: p.stock < p.minStock })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getLowStock() {
    const products = await this.prisma.$queryRaw<any[]>`
      SELECT p."id", p."sku", p."name", p."stock", p."min_stock" as "minStock",
             p."max_stock" as "maxStock", p."unit", p."main_image_url" as "mainImageUrl",
             p."status", p."category_id" as "categoryId",
             c."id" as "category_id", c."name" as "categoryName"
      FROM products p
      LEFT JOIN categories c ON c."id" = p."category_id"
      WHERE p."stock" < p."min_stock"
      ORDER BY (p."stock"::float / NULLIF(p."min_stock", 0)) ASC
    `;

    return products.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      stock: p.stock,
      minStock: p.minStock,
      maxStock: p.maxStock,
      unit: p.unit,
      mainImageUrl: p.mainImageUrl,
      status: p.status,
      category: { id: p.categoryId, name: p.categoryName },
      deficit: p.minStock - p.stock,
    }));
  }

  async createMovement(dto: CreateMovementDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: dto.productId },
      });

      if (!product) {
        throw new NotFoundException('Produto não encontrado');
      }

      const previousStock = product.stock;
      let newStock: number;

      switch (dto.type) {
        case InventoryMovementType.IN:
        case InventoryMovementType.RETURN:
          newStock = previousStock + dto.quantity;
          break;
        case InventoryMovementType.OUT:
        case InventoryMovementType.DAMAGE:
        case InventoryMovementType.TRANSFER:
          newStock = previousStock - dto.quantity;
          if (newStock < 0) {
            throw new BadRequestException(
              `Estoque insuficiente. Disponível: ${previousStock} ${product.unit}`,
            );
          }
          break;
        case InventoryMovementType.ADJUSTMENT:
          newStock = dto.quantity;
          break;
        default:
          throw new BadRequestException('Tipo de movimentação inválido');
      }

      await tx.product.update({
        where: { id: dto.productId },
        data: { stock: newStock },
      });

      const movement = await tx.inventoryMovement.create({
        data: {
          productId: dto.productId,
          type: dto.type,
          quantity: dto.quantity,
          previousStock,
          newStock,
          reason: dto.reason,
          performedById: userId,
        },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          performedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      return movement;
    });
  }

  async getMovements(params: {
    page?: number;
    limit?: number;
    productId?: string;
    type?: InventoryMovementType;
    startDate?: string;
    endDate?: string;
  }) {
    const { page = 1, limit = 20, productId, type, startDate, endDate } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryMovementWhereInput = {};

    if (productId) {
      where.productId = productId;
    }

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true, unit: true } },
          performedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async adjustStock(dto: AdjustStockDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: dto.productId },
      });

      if (!product) {
        throw new NotFoundException('Produto não encontrado');
      }

      const previousStock = product.stock;
      const newStock = previousStock + dto.quantity;

      if (newStock < 0) {
        throw new BadRequestException(
          `Ajuste resultaria em estoque negativo. Estoque atual: ${previousStock} ${product.unit}`,
        );
      }

      await tx.product.update({
        where: { id: dto.productId },
        data: { stock: newStock },
      });

      const movement = await tx.inventoryMovement.create({
        data: {
          productId: dto.productId,
          type: InventoryMovementType.ADJUSTMENT,
          quantity: Math.abs(dto.quantity),
          previousStock,
          newStock,
          reason: dto.reason,
          performedById: userId,
        },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          performedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      return movement;
    });
  }
}
