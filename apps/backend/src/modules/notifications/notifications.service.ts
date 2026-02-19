import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType, Role } from '@prisma/client';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsGateway))
    private gateway: NotificationsGateway,
  ) {}

  async findAll(
    userId: string,
    params: { page?: number; limit?: number; isRead?: boolean },
  ) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (params.isRead !== undefined) {
      where.isRead = params.isRead;
    }

    const [notifications, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: any;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        data: data.data,
      },
    });
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notificação não encontrada');
    }

    return this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { message: 'Todas as notificações foram marcadas como lidas' };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { unreadCount: count };
  }

  async getPreferences(userId: string) {
    let prefs = await this.prisma.notificationPreferences.findUnique({
      where: { userId },
    });

    if (!prefs) {
      prefs = await this.prisma.notificationPreferences.create({
        data: { userId },
      });
    }

    return prefs;
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    const prefs = await this.getPreferences(userId);

    return this.prisma.notificationPreferences.update({
      where: { id: prefs.id },
      data: dto,
    });
  }

  // ───── Order-related notification helpers ─────

  /**
   * ORDER_CREATED: notify admins, managers, sellers
   */
  async notifyNewOrder(order: {
    id: string;
    orderNumber: string;
    total: number;
    customer: { firstName: string; lastName: string };
  }) {
    const title = 'Novo Pedido';
    const body = `Pedido ${order.orderNumber} criado por ${order.customer.firstName} ${order.customer.lastName} — R$ ${order.total.toFixed(2)}`;
    const payload = {
      type: NotificationType.NEW_ORDER,
      title,
      body,
      data: { orderId: order.id, orderNumber: order.orderNumber },
    };

    // Persist for all admins, managers, sellers
    const staffUsers = await this.prisma.user.findMany({
      where: { role: { in: [Role.ADMIN, Role.MANAGER, Role.SELLER] }, isActive: true },
      select: { id: true },
    });

    if (staffUsers.length > 0) {
      await this.prisma.notification.createMany({
        data: staffUsers.map((u) => ({
          userId: u.id,
          type: NotificationType.NEW_ORDER,
          title,
          body,
          data: { orderId: order.id, orderNumber: order.orderNumber },
        })),
      });
    }

    // Real-time push to role rooms
    this.gateway.emitToRoles(
      [Role.ADMIN, Role.MANAGER, Role.SELLER],
      'newOrder',
      payload,
    );
  }

  /**
   * ORDER_STATUS_CHANGED: notify the customer
   */
  async notifyOrderStatusChanged(order: {
    id: string;
    orderNumber: string;
    customerId: string;
    status: string;
  }) {
    const statusLabels: Record<string, string> = {
      CONFIRMED: 'confirmado',
      PROCESSING: 'em preparação',
      READY_FOR_PICKUP: 'pronto para retirada',
      OUT_FOR_DELIVERY: 'saiu para entrega',
      DELIVERED: 'entregue',
      CANCELLED: 'cancelado',
      REFUNDED: 'reembolsado',
    };

    const statusLabel = statusLabels[order.status] || order.status;
    const title = 'Atualização do Pedido';
    const body = `Seu pedido ${order.orderNumber} foi ${statusLabel}`;
    const payload = {
      type: NotificationType.ORDER_STATUS,
      title,
      body,
      data: { orderId: order.id, orderNumber: order.orderNumber, status: order.status },
    };

    // Persist for customer
    await this.create({
      userId: order.customerId,
      type: NotificationType.ORDER_STATUS,
      title,
      body,
      data: payload.data,
    });

    // Real-time push to customer
    this.gateway.emitToUser(order.customerId, 'orderStatusChanged', payload);
  }

  /**
   * ORDER_READY_FOR_PICKUP: notify delivery persons + customer
   */
  async notifyOrderReadyForPickup(order: {
    id: string;
    orderNumber: string;
    customerId: string;
  }) {
    const title = 'Pedido Pronto para Retirada';
    const body = `O pedido ${order.orderNumber} está pronto para coleta`;
    const data = { orderId: order.id, orderNumber: order.orderNumber };

    // Persist for all delivery persons
    const deliveryUsers = await this.prisma.user.findMany({
      where: { role: Role.DELIVERY, isActive: true },
      select: { id: true },
    });

    if (deliveryUsers.length > 0) {
      await this.prisma.notification.createMany({
        data: deliveryUsers.map((u) => ({
          userId: u.id,
          type: NotificationType.DELIVERY_UPDATE,
          title,
          body,
          data,
        })),
      });
    }

    // Real-time push to delivery role
    this.gateway.emitToRole(Role.DELIVERY, 'orderReadyForPickup', {
      type: NotificationType.DELIVERY_UPDATE,
      title,
      body,
      data,
    });

    // Also notify the customer
    const customerTitle = 'Pedido Pronto!';
    const customerBody = `Seu pedido ${order.orderNumber} está pronto para retirada`;

    await this.create({
      userId: order.customerId,
      type: NotificationType.ORDER_STATUS,
      title: customerTitle,
      body: customerBody,
      data,
    });

    this.gateway.emitToUser(order.customerId, 'orderStatusChanged', {
      type: NotificationType.ORDER_STATUS,
      title: customerTitle,
      body: customerBody,
      data: { ...data, status: 'READY_FOR_PICKUP' },
    });
  }

  /**
   * ORDER_CANCELLED: notify admins, managers, sellers
   */
  async notifyOrderCancelled(order: {
    id: string;
    orderNumber: string;
    customer: { firstName: string; lastName: string };
    reason?: string;
  }) {
    const title = 'Pedido Cancelado';
    const body = `Pedido ${order.orderNumber} cancelado por ${order.customer.firstName} ${order.customer.lastName}` + (order.reason ? `: ${order.reason}` : '');
    const payload = {
      type: NotificationType.ORDER_STATUS,
      title,
      body,
      data: { orderId: order.id, orderNumber: order.orderNumber, reason: order.reason },
    };

    // Persist for all admins, managers, sellers
    const staffUsers = await this.prisma.user.findMany({
      where: { role: { in: [Role.ADMIN, Role.MANAGER, Role.SELLER] }, isActive: true },
      select: { id: true },
    });

    if (staffUsers.length > 0) {
      await this.prisma.notification.createMany({
        data: staffUsers.map((u) => ({
          userId: u.id,
          type: NotificationType.ORDER_STATUS,
          title,
          body,
          data: { orderId: order.id, orderNumber: order.orderNumber, reason: order.reason },
        })),
      });
    }

    // Real-time push to role rooms
    this.gateway.emitToRoles(
      [Role.ADMIN, Role.MANAGER, Role.SELLER],
      'orderStatusChanged',
      payload,
    );
  }
}
