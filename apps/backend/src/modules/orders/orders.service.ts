import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, OrderStatus, OrderType, FulfillmentType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [
    OrderStatus.READY_FOR_PICKUP,
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};

const orderInclude = {
  items: {
    include: {
      product: {
        select: { id: true, name: true, mainImageUrl: true, unit: true },
      },
    },
  },
  customer: {
    select: { id: true, firstName: true, lastName: true, email: true, phone: true },
  },
  deliveryAddress: true,
  coupon: { select: { id: true, code: true, type: true, value: true } },
};

const orderDetailInclude = {
  ...orderInclude,
  payment: true,
  delivery: {
    include: {
      locationHistory: { orderBy: { createdAt: Prisma.SortOrder.desc }, take: 1 },
    },
  },
  pickingOrder: {
    include: {
      seller: { select: { id: true, firstName: true, lastName: true } },
    },
  },
  statusHistory: { orderBy: { createdAt: Prisma.SortOrder.asc } },
};

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PED-${timestamp}-${random}`;
  }

  async create(userId: string, dto: CreateOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Validate delivery address for DELIVERY orders
      if (dto.fulfillmentType === FulfillmentType.DELIVERY) {
        if (!dto.deliveryAddressId) {
          throw new BadRequestException(
            'Endereço de entrega é obrigatório para pedidos com entrega',
          );
        }
        const address = await tx.address.findFirst({
          where: { id: dto.deliveryAddressId, userId },
        });
        if (!address) {
          throw new NotFoundException('Endereço de entrega não encontrado');
        }
      }

      // 2. Validate products and stock
      const productIds = dto.items.map((item) => item.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      if (products.length !== productIds.length) {
        throw new NotFoundException('Um ou mais produtos não foram encontrados');
      }

      const productMap = new Map(products.map((p) => [p.id, p]));

      for (const item of dto.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new BadRequestException(
            `Produto com ID "${item.productId}" não foi encontrado`,
          );
        }
        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Estoque insuficiente para "${product.name}". Disponível: ${product.stock} ${product.unit}`,
          );
        }
      }

      // 3. Calculate totals
      let subtotal = 0;
      let tax = 0;
      const orderItems: Prisma.OrderItemCreateWithoutOrderInput[] = [];

      for (const item of dto.items) {
        const product = productMap.get(item.productId)!;
        const itemTotal = product.price * item.quantity;
        const itemTax = itemTotal * product.taxRate;
        subtotal += itemTotal;
        tax += itemTax;

        orderItems.push({
          product: { connect: { id: product.id } },
          productName: product.name,
          productImage: product.mainImageUrl,
          quantity: item.quantity,
          unitPrice: product.price,
          total: Math.round(itemTotal * 100) / 100,
          notes: item.notes,
        });
      }

      subtotal = Math.round(subtotal * 100) / 100;
      tax = Math.round(tax * 100) / 100;

      // 4. Apply coupon if provided
      let discount = 0;
      let couponId: string | null = null;

      if (dto.couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: dto.couponCode },
        });

        if (!coupon) {
          throw new NotFoundException('Cupom não encontrado');
        }

        if (!coupon.isActive) {
          throw new BadRequestException('Cupom não está ativo');
        }

        if (coupon.expiresAt && coupon.expiresAt < new Date()) {
          throw new BadRequestException('Cupom expirado');
        }

        if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
          throw new BadRequestException('Cupom atingiu o limite de uso');
        }

        if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
          throw new BadRequestException(
            `Valor mínimo do pedido para este cupom é R$ ${coupon.minOrderValue.toFixed(2)}`,
          );
        }

        if (coupon.type === 'PERCENTAGE') {
          discount = subtotal * (coupon.value / 100);
          if (coupon.maxDiscountValue && discount > coupon.maxDiscountValue) {
            discount = coupon.maxDiscountValue;
          }
        } else if (coupon.type === 'FIXED_AMOUNT') {
          discount = coupon.value;
        }

        discount = Math.round(Math.min(discount, subtotal) * 100) / 100;
        couponId = coupon.id;

        await tx.coupon.update({
          where: { id: coupon.id },
          data: { currentUses: { increment: 1 } },
        });
      }

      // 5. Calculate delivery fee
      const deliveryFee =
        dto.fulfillmentType === FulfillmentType.DELIVERY ? 5.99 : 0;

      const total =
        Math.round((subtotal + tax + deliveryFee - discount) * 100) / 100;

      // 6. Create order
      const order = await tx.order.create({
        data: {
          orderNumber: this.generateOrderNumber(),
          customerId: userId,
          status: OrderStatus.PENDING,
          type: OrderType.ONLINE,
          fulfillmentType: dto.fulfillmentType,
          subtotal,
          tax,
          deliveryFee,
          discount,
          total,
          couponId,
          deliveryAddressId: dto.deliveryAddressId || null,
          notes: dto.notes,
          items: { create: orderItems },
          statusHistory: {
            create: {
              status: OrderStatus.PENDING,
              notes: 'Pedido criado',
              changedBy: userId,
            },
          },
        },
        include: orderInclude,
      });

      // 7. Update product stock and sales count
      for (const item of dto.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            salesCount: { increment: item.quantity },
          },
        });
      }

      // 8. Clear cart
      const cart = await tx.cart.findUnique({ where: { userId } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      // 9. Create picking order for online orders
      await tx.pickingOrder.create({
        data: {
          orderId: order.id,
          totalItems: dto.items.reduce((sum, i) => sum + i.quantity, 0),
          items: {
            create: order.items.map((oi) => ({
              orderItemId: oi.id,
              productId: oi.productId,
              quantity: oi.quantity,
            })),
          },
        },
      });

      return order;
    });
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    status?: OrderStatus;
    customerId?: string;
    type?: OrderType;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      page = 1,
      limit = 20,
      status,
      customerId,
      type,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (type) where.type = type;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const allowedSortFields = [
      'createdAt',
      'updatedAt',
      'total',
      'status',
      'orderNumber',
    ];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: orderInclude,
        skip,
        take: limit,
        orderBy: { [orderField]: sortOrder },
      }),
      this.prisma.order.count({ where }),
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

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: orderDetailInclude,
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return order;
  }

  async findByUser(
    userId: string,
    params: {
      page?: number;
      limit?: number;
      status?: OrderStatus;
    },
  ) {
    const { page = 1, limit = 20, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = { customerId: userId };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: orderInclude,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
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

  async updateStatus(id: string, dto: UpdateOrderStatusDto, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    const allowed = ALLOWED_STATUS_TRANSITIONS[order.status];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Não é possível alterar o status de "${order.status}" para "${dto.status}"`,
      );
    }

    const updateData: Prisma.OrderUpdateInput = {
      status: dto.status,
    };

    if (dto.status === OrderStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
    }
    if (dto.status === OrderStatus.CANCELLED) {
      updateData.cancelledAt = new Date();
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        ...updateData,
        statusHistory: {
          create: {
            status: dto.status,
            notes: dto.notes,
            changedBy: userId,
          },
        },
      },
      include: orderInclude,
    });

    return updated;
  }

  async cancel(id: string, userId: string, reason?: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!order) {
        throw new NotFoundException('Pedido não encontrado');
      }

      if (order.customerId !== userId) {
        throw new ForbiddenException('Você não tem permissão para cancelar este pedido');
      }

      const cancellableStatuses: OrderStatus[] = [
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
      ];

      if (!cancellableStatuses.includes(order.status)) {
        throw new BadRequestException(
          'Este pedido não pode mais ser cancelado. Status atual: ' + order.status,
        );
      }

      // Restore stock
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
            salesCount: { decrement: item.quantity },
          },
        });
      }

      // Cancel picking order
      await tx.pickingOrder.updateMany({
        where: { orderId: id },
        data: { status: 'CANCELLED' },
      });

      const cancelled = await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelReason: reason || 'Cancelado pelo cliente',
          statusHistory: {
            create: {
              status: OrderStatus.CANCELLED,
              notes: reason || 'Cancelado pelo cliente',
              changedBy: userId,
            },
          },
        },
        include: orderInclude,
      });

      return cancelled;
    });
  }

  async getTracking(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        createdAt: true,
        estimatedDeliveryTime: true,
        deliveredAt: true,
        statusHistory: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return order;
  }
}
