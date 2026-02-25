import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PickingStatus, OrderStatus, InventoryMovementType, PaymentMethod } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { QuickCreateCustomerDto } from './dto/quick-create-customer.dto';

@Injectable()
export class SellerService {
  constructor(private prisma: PrismaService) {}

  // ==================== POS / SALES ====================

  private generateOrderNumber(): string {
    return (
      'POS-' +
      Date.now().toString(36).toUpperCase() +
      Math.random().toString(36).substring(2, 6).toUpperCase()
    );
  }

  async createSale(sellerId: string, dto: CreateSaleDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Validate all products and check stock
      const productIds = dto.items.map((item) => item.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      if (products.length !== productIds.length) {
        const foundIds = products.map((p) => p.id);
        const missing = productIds.filter((id) => !foundIds.includes(id));
        throw new NotFoundException(
          `Produtos não encontrados: ${missing.join(', ')}`,
        );
      }

      const productMap = new Map(products.map((p) => [p.id, p]));

      for (const item of dto.items) {
        const product = productMap.get(item.productId)!;
        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Estoque insuficiente para "${product.name}". Disponível: ${product.stock} ${product.unit}`,
          );
        }
      }

      // 2. Calculate totals
      let subtotal = 0;
      const saleItems: {
        productId: string;
        productName: string;
        barcode: string | null;
        quantity: number;
        unitPrice: number;
        discount: number;
        total: number;
      }[] = [];

      for (const item of dto.items) {
        const product = productMap.get(item.productId)!;
        const itemDiscount = item.discount ?? 0;
        const itemTotal = item.unitPrice * item.quantity - itemDiscount;
        subtotal += itemTotal;

        saleItems.push({
          productId: item.productId,
          productName: product.name,
          barcode: product.barcode,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: itemDiscount,
          total: Math.round(itemTotal * 100) / 100,
        });
      }

      const generalDiscount = dto.discount ?? 0;
      const taxableAmount = subtotal - generalDiscount;
      const tax = products.reduce((sum, p) => {
        const item = dto.items.find((i) => i.productId === p.id)!;
        return sum + item.unitPrice * item.quantity * (p.taxRate / 100);
      }, 0);
      const total = Math.round((taxableAmount + tax) * 100) / 100;

      const paidAmount = dto.paidAmount ?? total;
      if (paidAmount < total) {
        throw new BadRequestException(
          `Valor pago (R$ ${paidAmount.toFixed(2)}) é inferior ao total (R$ ${total.toFixed(2)})`,
        );
      }
      const change = Math.round((paidAmount - total) * 100) / 100;

      // 3. Create sale
      const sale = await tx.sale.create({
        data: {
          orderNumber: this.generateOrderNumber(),
          sellerId,
          customerId: dto.customerId || null,
          subtotal: Math.round(subtotal * 100) / 100,
          discount: generalDiscount,
          tax: Math.round(tax * 100) / 100,
          total,
          paymentMethod: dto.paymentMethod,
          paidAmount,
          change,
          notes: dto.notes || null,
          completedAt: new Date(),
          items: {
            create: saleItems,
          },
        },
        include: {
          items: true,
        },
      });

      // 4. Update stock and record inventory movements
      for (const item of dto.items) {
        const product = productMap.get(item.productId)!;
        const newStock = product.stock - item.quantity;

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: newStock,
            salesCount: { increment: item.quantity },
          },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            type: InventoryMovementType.OUT,
            quantity: item.quantity,
            previousStock: product.stock,
            newStock,
            reason: `Venda POS #${sale.orderNumber}`,
            referenceId: sale.id,
            referenceType: 'SALE',
            performedById: sellerId,
          },
        });
      }

      return sale;
    });
  }

  async getSaleHistory(
    sellerId: string,
    params: { page?: number; limit?: number; startDate?: string; endDate?: string },
  ) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { sellerId };

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = new Date(params.startDate);
      if (params.endDate) where.createdAt.lte = new Date(params.endDate);
    }

    const [sales, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.sale.count({ where }),
    ]);

    return {
      data: sales,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSaleById(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, mainImageUrl: true, unit: true, barcode: true },
            },
          },
        },
        seller: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException('Venda não encontrada');
    }

    return sale;
  }

  async suspendSale(id: string) {
    const sale = await this.prisma.sale.findUnique({ where: { id } });
    if (!sale) throw new NotFoundException('Venda não encontrada');
    if (sale.isSuspended) throw new ConflictException('Venda já está suspensa');

    return this.prisma.sale.update({
      where: { id },
      data: { isSuspended: true, completedAt: null },
    });
  }

  async getSuspendedSales(sellerId: string) {
    return this.prisma.sale.findMany({
      where: { sellerId, isSuspended: true },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resumeSale(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!sale) throw new NotFoundException('Venda não encontrada');
    if (!sale.isSuspended) throw new ConflictException('Venda não está suspensa');

    return this.prisma.sale.update({
      where: { id },
      data: { isSuspended: false },
      include: { items: true },
    });
  }

  async getSellerStats(sellerId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [salesAgg, itemsAgg, pendingPickingOrders] = await Promise.all([
      this.prisma.sale.aggregate({
        where: {
          sellerId,
          createdAt: { gte: todayStart, lte: todayEnd },
          isSuspended: false,
        },
        _sum: { total: true },
        _count: { id: true },
      }),
      this.prisma.saleItem.aggregate({
        where: {
          sale: {
            sellerId,
            createdAt: { gte: todayStart, lte: todayEnd },
            isSuspended: false,
          },
        },
        _sum: { quantity: true },
      }),
      // count only picking orders that belong to this seller and are not yet completed
      this.prisma.pickingOrder.count({
        where: {
          sellerId,
          status: { in: [PickingStatus.ASSIGNED, PickingStatus.PICKING] },
        },
      }),
    ]);

    const todaySales = salesAgg._sum.total ?? 0;
    const todayOrders = salesAgg._count.id;
    const itemsSold = itemsAgg._sum.quantity ?? 0;

    return {
      todaySales: Math.round(todaySales * 100) / 100,
      todayOrders,
      todayTransactions: todayOrders,
      averageTicket:
        todayOrders > 0
          ? Math.round((todaySales / todayOrders) * 100) / 100
          : 0,
      itemsSold,
      pendingPickingOrders,
    };
  }

  // ==================== ORDER PICKING ====================

  async getPendingOrders() {
    const pickingOrders = await this.prisma.pickingOrder.findMany({
      where: { status: PickingStatus.PENDING },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            fulfillmentType: true,
            total: true,
            createdAt: true,
            customer: {
              select: { id: true, firstName: true, lastName: true },
            },
            items: {
              select: { id: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return pickingOrders.map((po) => ({
      id: po.order.id,
      orderNumber: po.order.orderNumber,
      customerName: po.order.customer
        ? `${po.order.customer.firstName} ${po.order.customer.lastName}`
        : 'Cliente',
      itemCount: po.order.items.length,
      total: po.order.total,
      deliveryMethod: po.order.fulfillmentType === 'DELIVERY' ? 'delivery' : 'pickup',
      createdAt: po.createdAt.toISOString(),
      status: po.status,
    }));
  }

  async acceptOrder(orderId: string, sellerId: string) {
    // fetch the seller user record for potential validation or auditing
    const sellerUser = await this.prisma.user.findUnique({
      where: { id: sellerId },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    const pickingOrder = await this.prisma.pickingOrder.findUnique({
      where: { orderId },
    });

    if (!pickingOrder) {
      throw new NotFoundException('Ordem de picking não encontrada para este pedido');
    }

    if (pickingOrder.status !== PickingStatus.PENDING) {
      throw new ConflictException('Esta ordem já foi aceita por outro vendedor');
    }

    const now = new Date();

    const [updatedPicking, updatedOrder] = await Promise.all([
      this.prisma.pickingOrder.update({
        where: { id: pickingOrder.id },
        data: {
          sellerId,
          status: PickingStatus.PICKING,
          assignedAt: now,
          startedAt: now,
        },
        include: {
          order: { select: { id: true, orderNumber: true, sellerId: true } },
        },
      }),
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PROCESSING, sellerId },
        select: { id: true, sellerId: true },
      }),
    ]);


    return updatedPicking;
  }

  async getPickingOrder(pickingOrderId: string) {
    const pickingOrder = await this.prisma.pickingOrder.findUnique({
      where: { id: pickingOrderId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customer: {
              select: { id: true, firstName: true, lastName: true, phone: true },
            },
          },
        },
        seller: {
          select: { id: true, firstName: true, lastName: true },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                barcode: true,
                mainImageUrl: true,
                aisleLocation: true,
                shelfPosition: true,
                unit: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!pickingOrder) {
      throw new NotFoundException('Ordem de picking não encontrada');
    }

    return pickingOrder;
  }

  async getMyPickingOrders(sellerId: string) {
    const pickingOrders = await this.prisma.pickingOrder.findMany({
      where: {
        sellerId,
        status: { in: [PickingStatus.ASSIGNED, PickingStatus.PICKING, PickingStatus.PICKED] },
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            fulfillmentType: true,
            total: true,
            createdAt: true,
            status: true,
            customer: {
              select: { id: true, firstName: true, lastName: true },
            },
            items: { select: { id: true } },
          },
        },
        items: {
          select: { id: true, isPicked: true },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });


    // normalize each pickingOrder into the lightweight shape used by the UI
    const mapped = pickingOrders.map((po) => ({
      id: po.order.id,
      orderNumber: po.order.orderNumber,
      customerName: po.order.customer
        ? `${po.order.customer.firstName} ${po.order.customer.lastName}`
        : 'Cliente',
      itemCount: po.order.items.length,
      total: po.order.total,
      deliveryMethod: po.order.fulfillmentType === 'DELIVERY' ? 'delivery' : 'pickup',
      createdAt: po.order.createdAt.toISOString(),
      status: po.order.status,
    }));

    if (mapped.length === 0) {
      const orders = await this.prisma.order.findMany({
        where: { sellerId },
        select: {
          id: true,
          orderNumber: true,
          fulfillmentType: true,
          total: true,
          createdAt: true,
          status: true,
          customer: {
            select: { id: true, firstName: true, lastName: true },
          },
          items: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
      });


      return orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customer
          ? `${o.customer.firstName} ${o.customer.lastName}`
          : 'Cliente',
        itemCount: o.items.length,
        total: o.total,
        deliveryMethod: o.fulfillmentType === 'DELIVERY' ? 'delivery' : 'pickup',
        createdAt: o.createdAt.toISOString(),
        status: o.status,
      }));
    }

    return mapped;
  }

  async scanItem(pickingOrderId: string, barcode: string, sellerId: string) {
    const pickingOrder = await this.prisma.pickingOrder.findUnique({
      where: { id: pickingOrderId },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, barcode: true },
            },
          },
        },
      },
    });

    if (!pickingOrder) {
      throw new NotFoundException('Ordem de picking não encontrada');
    }

    if (pickingOrder.sellerId !== sellerId) {
      throw new BadRequestException('Esta ordem não está atribuída a você');
    }

    // Find the picking item that matches the scanned barcode
    const matchingItem = pickingOrder.items.find(
      (item) => item.product.barcode === barcode && !item.isPicked,
    );

    if (!matchingItem) {
      // Check if the barcode exists in the order but is already picked
      const alreadyPicked = pickingOrder.items.find(
        (item) => item.product.barcode === barcode && item.isPicked,
      );

      if (alreadyPicked) {
        return {
          success: false,
          message: `Produto "${alreadyPicked.product.name}" já foi coletado`,
        };
      }

      // Barcode doesn't match any expected product
      const pendingItems = pickingOrder.items.filter((item) => !item.isPicked);
      return {
        success: false,
        message: 'Código de barras não corresponde a nenhum produto esperado',
        expectedProducts: pendingItems.map((item) => ({
          id: item.product.id,
          name: item.product.name,
          barcode: item.product.barcode,
          quantity: item.quantity,
        })),
      };
    }

    // Mark item as picked
    const updatedItem = await this.prisma.pickingItem.update({
      where: { id: matchingItem.id },
      data: {
        isPicked: true,
        pickedQuantity: matchingItem.quantity,
        pickedAt: new Date(),
      },
    });

    // Update picked count
    const newPickedCount = pickingOrder.pickedItems + 1;
    const allPicked = newPickedCount >= pickingOrder.totalItems;

    await this.prisma.pickingOrder.update({
      where: { id: pickingOrderId },
      data: {
        pickedItems: newPickedCount,
        status: allPicked ? PickingStatus.PICKED : undefined,
      },
    });

    return {
      success: true,
      message: `Produto "${matchingItem.product.name}" coletado com sucesso`,
      item: updatedItem,
      progress: {
        picked: newPickedCount,
        total: pickingOrder.totalItems,
        allPicked,
      },
    };
  }

  async markItemPicked(pickingItemId: string, sellerId: string, notes?: string) {
    const pickingItem = await this.prisma.pickingItem.findUnique({
      where: { id: pickingItemId },
      include: {
        pickingOrder: true,
        product: { select: { id: true, name: true } },
      },
    });

    if (!pickingItem) {
      throw new NotFoundException('Item de picking não encontrado');
    }

    if (pickingItem.pickingOrder.sellerId !== sellerId) {
      throw new BadRequestException('Esta ordem não está atribuída a você');
    }

    if (pickingItem.isPicked) {
      throw new ConflictException('Este item já foi coletado');
    }

    const updatedItem = await this.prisma.pickingItem.update({
      where: { id: pickingItemId },
      data: {
        isPicked: true,
        pickedQuantity: pickingItem.quantity,
        pickedAt: new Date(),
        notes: notes || 'Coleta manual sem leitura de código de barras',
      },
    });

    // Update picked count
    const newPickedCount = pickingItem.pickingOrder.pickedItems + 1;
    const allPicked = newPickedCount >= pickingItem.pickingOrder.totalItems;

    await this.prisma.pickingOrder.update({
      where: { id: pickingItem.pickingOrderId },
      data: {
        pickedItems: newPickedCount,
        status: allPicked ? PickingStatus.PICKED : undefined,
      },
    });

    return {
      success: true,
      message: `Produto "${pickingItem.product.name}" marcado como coletado manualmente`,
      item: updatedItem,
      progress: {
        picked: newPickedCount,
        total: pickingItem.pickingOrder.totalItems,
        allPicked,
      },
    };
  }

  async completePickingOrder(pickingOrderId: string, sellerId: string) {
    const pickingOrder = await this.prisma.pickingOrder.findUnique({
      where: { id: pickingOrderId },
    });

    if (!pickingOrder) {
      throw new NotFoundException('Ordem de picking não encontrada');
    }

    if (pickingOrder.sellerId !== sellerId) {
      throw new BadRequestException('Esta ordem não está atribuída a você');
    }

    if (
      pickingOrder.status !== PickingStatus.PICKED &&
      pickingOrder.status !== PickingStatus.PICKING
    ) {
      throw new ConflictException(
        'Ordem de picking não está em estado válido para conclusão',
      );
    }

    const [updated] = await Promise.all([
      this.prisma.pickingOrder.update({
        where: { id: pickingOrderId },
        data: {
          status: PickingStatus.READY,
          completedAt: new Date(),
        },
        include: {
          order: { select: { id: true, orderNumber: true } },
        },
      }),
      this.prisma.order.update({
        where: { id: pickingOrder.orderId },
        data: { status: OrderStatus.READY_FOR_PICKUP },
      }),
    ]);

    return updated;
  }

  // ==================== READY FOR DELIVERY ====================

  async getReadyForDeliveryOrders() {
    const orders = await this.prisma.order.findMany({
      where: { status: OrderStatus.READY_FOR_PICKUP },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        deliveryAddress: true,
        items: {
          include: {
            product: {
              select: { id: true, name: true, mainImageUrl: true },
            },
          },
        },
        delivery: true,
      },
      orderBy: { updatedAt: 'asc' },
    });

    // Enrich with delivery person info
    const enriched = await Promise.all(
      orders.map(async (order) => {
        let deliveryPerson = null;
        if (order.delivery?.deliveryPersonId) {
          deliveryPerson = await this.prisma.user.findUnique({
            where: { id: order.delivery.deliveryPersonId },
            select: { id: true, firstName: true, lastName: true },
          });
        }
        return {
          ...order,
          customer: {
            ...order.customer,
            name: `${order.customer.firstName} ${order.customer.lastName}`,
          },
          address: order.deliveryAddress,
          delivery: order.delivery
            ? {
                ...order.delivery,
                deliveryPerson: deliveryPerson
                  ? { id: deliveryPerson.id, name: `${deliveryPerson.firstName} ${deliveryPerson.lastName}` }
                  : null,
              }
            : null,
        };
      }),
    );

    return enriched;
  }

  // ==================== READY FOR DELIVERY ====================

  /**
   * Fetch orders that are already owned by a given seller.  The previous implementation
   * (and some of the generated documentation) simply returned all confirmed/picking
   * orders regardless of who they belonged to, which meant sellers could see orders
   * assigned to other users.  When attempting to restrict by the user id we also ran
   * into a subtle bug: the value stored in `order.sellerId` does not necessarily match
   * the numeric/uuid value of the record in the users table for that seller.  The
   * correct way to filter is to compare against the literal column on the order row.
   */
  async getOrders(sellerId: string, filter: 'all' | 'pending' | 'picking' = 'all') {
    const statusFilter =
      filter === 'pending'
        ? [OrderStatus.CONFIRMED]
        : filter === 'picking'
        ? [OrderStatus.PROCESSING]
        : [OrderStatus.CONFIRMED, OrderStatus.PROCESSING];

    const orders = await this.prisma.order.findMany({
      where: {
        sellerId,
        status: { in: statusFilter },
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: [{ createdAt: 'asc' }],
    });

    return orders.map((order) => {
      // order comes from Prisma with a typed shape; `items` is available because we included them
      const pickedItems = order.items.filter((item: any) => item.status === 'PICKED').length;

      return {
        ...order,
        // build a readable customer name since we only selected first/last above
        customer: order.customer
          ? {
              ...order.customer,
              name: `${order.customer.firstName} ${order.customer.lastName}`,
            }
          : null,
        priority: this.calculatePriority(order),
        minutesAgo: Math.floor(
          (new Date().getTime() - new Date(order.createdAt).getTime()) / 60000,
        ),
        pickedItemsCount: pickedItems,
        totalItemsCount: order.items.length,
      };
    });
  }

  private calculatePriority(order: any): 'NORMAL' | 'HIGH' | 'URGENT' {
    if (!order.scheduledAt) return 'NORMAL';

    const now = new Date();
    const hoursUntil =
      (new Date(order.scheduledAt).getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntil < 1) return 'URGENT';
    if (hoursUntil < 2) return 'HIGH';
    return 'NORMAL';
  }

  // ==================== PRODUCTS ====================

  async getProductByBarcode(barcode: string) {
    const product = await this.prisma.product.findUnique({
      where: { barcode },
      select: {
        id: true,
        sku: true,
        barcode: true,
        name: true,
        price: true,
        stock: true,
        unit: true,
        mainImageUrl: true,
        taxRate: true,
        aisleLocation: true,
        shelfPosition: true,
        status: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado com este código de barras');
    }

    return product;
  }

  // ==================== CUSTOMERS ====================

  async searchCustomers(query: string) {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('A busca deve ter pelo menos 2 caracteres');
    }

    return this.prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
      take: 20,
    });
  }

  async quickCreateCustomer(dto: QuickCreateCustomerDto) {
    const nameParts = dto.name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // Check if phone already exists
    const existing = await this.prisma.user.findFirst({
      where: { phone: dto.phone },
    });

    if (existing) {
      throw new ConflictException('Já existe um cliente com este telefone');
    }

    const customer = await this.prisma.user.create({
      data: {
        firstName,
        lastName,
        phone: dto.phone,
        email: dto.email || `${dto.phone}@temp.local`,
        password: '',
        role: 'CUSTOMER',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });

    return customer;
  }
}
