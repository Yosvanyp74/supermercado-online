import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PurchaseOrderStatus } from '@prisma/client';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { page?: number; limit?: number; search?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { contactName: { contains: params.search, mode: 'insensitive' } },
        { cnpj: { contains: params.search } },
      ];
    }

    const [suppliers, total] = await this.prisma.$transaction([
      this.prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return {
      data: suppliers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    return supplier;
  }

  async create(dto: CreateSupplierDto) {
    if (dto.cnpj) {
      const existing = await this.prisma.supplier.findUnique({
        where: { cnpj: dto.cnpj },
      });
      if (existing) {
        throw new BadRequestException('Já existe um fornecedor com este CNPJ');
      }
    }

    return this.prisma.supplier.create({ data: dto });
  }

  async update(id: string, dto: Partial<CreateSupplierDto>) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });

    if (!supplier) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    return this.prisma.supplier.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });

    if (!supplier) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    await this.prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Fornecedor desativado com sucesso' };
  }

  async createPurchaseOrder(dto: CreatePurchaseOrderDto, userId: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: dto.supplierId },
    });

    if (!supplier) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    const items = dto.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitCost: item.unitCost,
      total: item.quantity * item.unitCost,
    }));

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);

    return this.prisma.purchaseOrder.create({
      data: {
        supplierId: dto.supplierId,
        subtotal,
        total: subtotal,
        notes: dto.notes,
        expectedDeliveryDate: dto.expectedDeliveryDate
          ? new Date(dto.expectedDeliveryDate)
          : undefined,
        createdById: userId,
        items: {
          create: items,
        },
      },
      include: { items: true, supplier: true },
    });
  }

  async getPurchaseOrders(params: {
    page?: number;
    limit?: number;
    status?: PurchaseOrderStatus;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) {
      where.status = params.status;
    }

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
            },
          },
        },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async receivePurchaseOrder(
    id: string,
    items: { itemId: string; receivedQuantity: number }[],
  ) {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      throw new NotFoundException('Pedido de compra não encontrado');
    }

    if (order.status === PurchaseOrderStatus.RECEIVED) {
      throw new BadRequestException('Pedido de compra já foi recebido');
    }

    const operations: any[] = [];

    for (const receivedItem of items) {
      const orderItem = order.items.find((i) => i.id === receivedItem.itemId);
      if (!orderItem) continue;

      operations.push(
        this.prisma.purchaseOrderItem.update({
          where: { id: receivedItem.itemId },
          data: { receivedQuantity: receivedItem.receivedQuantity },
        }),
      );

      operations.push(
        this.prisma.product.update({
          where: { id: orderItem.productId },
          data: {
            stock: { increment: receivedItem.receivedQuantity },
          },
        }),
      );
    }

    operations.push(
      this.prisma.purchaseOrder.update({
        where: { id },
        data: {
          status: PurchaseOrderStatus.RECEIVED,
          receivedAt: new Date(),
        },
      }),
    );

    await this.prisma.$transaction(operations);

    return this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true, supplier: true },
    });
  }
}
