import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { DeliveryStatus, OrderStatus } from '@prisma/client';
import { AssignDeliveryDto } from './dto/assign-delivery.dto';
import { RateDeliveryDto } from './dto/rate-delivery.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { Inject, forwardRef } from '@nestjs/common';

@Injectable()
export class DeliveryService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  async assignDelivery(dto: AssignDeliveryDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { delivery: true },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    if (order.delivery) {
      throw new BadRequestException('Pedido já possui entrega atribuída');
    }

    const deliveryPerson = await this.prisma.user.findUnique({
      where: { id: dto.deliveryPersonId },
    });

    if (!deliveryPerson || deliveryPerson.role !== 'DELIVERY') {
      throw new BadRequestException('Entregador inválido');
    }

    const [delivery] = await this.prisma.$transaction([
      this.prisma.delivery.create({
        data: {
          orderId: dto.orderId,
          deliveryPersonId: dto.deliveryPersonId,
          status: DeliveryStatus.ASSIGNED,
        },
      }),
      this.prisma.order.update({
        where: { id: dto.orderId },
        data: {
          deliveryPersonId: dto.deliveryPersonId,
          status: OrderStatus.OUT_FOR_DELIVERY,
        },
      }),
      this.prisma.orderStatusHistory.create({
        data: {
          orderId: dto.orderId,
          status: OrderStatus.OUT_FOR_DELIVERY,
          notes: `Entrega atribuída ao entregador ${deliveryPerson.firstName} ${deliveryPerson.lastName}`,
        },
      }),
    ]);

    // Notificar a admins, managers y sellers
    if (order && deliveryPerson) {
      await this.notificationsService.notifyDeliveryAssigned({
        orderId: order.id,
        orderNumber: order.orderNumber,
        deliveryPerson: {
          id: deliveryPerson.id,
          firstName: deliveryPerson.firstName,
          lastName: deliveryPerson.lastName,
        },
      });
    }
    return delivery;
  }

  async getAvailableOrders() {
    const orders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.READY_FOR_PICKUP,
        delivery: null,
        fulfillmentType: 'DELIVERY',
      },
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
      },
      orderBy: { updatedAt: 'asc' },
    });

    return orders.map((order) => ({
      ...order,
      customer: {
        ...order.customer,
        name: `${order.customer.firstName} ${order.customer.lastName}`,
      },
    }));
  }

  async selfAssignDelivery(orderId: string, deliveryPersonId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { delivery: true },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    if (order.status !== OrderStatus.READY_FOR_PICKUP) {
      throw new BadRequestException('Pedido não está pronto para entrega');
    }

    if (order.delivery) {
      throw new BadRequestException('Pedido já possui entregador atribuído');
    }

    const deliveryPerson = await this.prisma.user.findUnique({
      where: { id: deliveryPersonId },
    });

    if (!deliveryPerson || deliveryPerson.role !== 'DELIVERY') {
      throw new BadRequestException('Usuário não é um entregador válido');
    }

    // Check if delivery person already has too many active deliveries
    const activeCount = await this.prisma.delivery.count({
      where: {
        deliveryPersonId,
        status: {
          in: [DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT],
        },
      },
    });

    if (activeCount >= 5) {
      throw new BadRequestException('Você já possui 5 entregas ativas. Conclua alguma antes de aceitar novas.');
    }

    const [delivery] = await this.prisma.$transaction([
      this.prisma.delivery.create({
        data: {
          orderId,
          deliveryPersonId,
          status: DeliveryStatus.ASSIGNED,
        },
      }),
      this.prisma.order.update({
        where: { id: orderId },
        data: {
          deliveryPersonId,
          status: OrderStatus.OUT_FOR_DELIVERY,
        },
      }),
      this.prisma.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.OUT_FOR_DELIVERY,
          changedBy: deliveryPersonId,
          notes: `Entregador ${deliveryPerson.firstName} ${deliveryPerson.lastName} aceitou a entrega`,
        },
      }),
    ]);

    // Notificar a admins, managers y sellers
    if (order && deliveryPerson) {
      await this.notificationsService.notifyDeliveryAssigned({
        orderId: order.id,
        orderNumber: order.orderNumber,
        deliveryPerson: {
          id: deliveryPerson.id,
          firstName: deliveryPerson.firstName,
          lastName: deliveryPerson.lastName,
        },
      });
    }
    return delivery;
  }

  async getActiveDeliveries(deliveryPersonId: string) {
    return this.prisma.delivery.findMany({
      where: {
        deliveryPersonId,
        status: {
          in: [
            DeliveryStatus.ASSIGNED,
            DeliveryStatus.PICKED_UP,
            DeliveryStatus.IN_TRANSIT,
          ],
        },
      },
      include: {
        order: {
          include: {
            items: true,
            deliveryAddress: true,
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDeliveryHistory(deliveryPersonId: string) {
    return this.prisma.delivery.findMany({
      where: {
        deliveryPersonId,
        status: {
          in: [
            DeliveryStatus.DELIVERED,
            DeliveryStatus.FAILED,
            DeliveryStatus.RETURNED,
          ],
        },
      },
      include: {
        order: {
          include: {
            items: true,
            deliveryAddress: true,
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { deliveredAt: 'desc' },
      take: 50,
    });
  }

  async updateLocation(deliveryId: string, latitude: number, longitude: number) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      throw new NotFoundException('Entrega não encontrada');
    }

    await this.prisma.deliveryLocationHistory.create({
      data: {
        deliveryId,
        latitude,
        longitude,
      },
    });

    return this.prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        currentLatitude: latitude,
        currentLongitude: longitude,
      },
    });
  }

  async updateStatus(deliveryId: string, status: DeliveryStatus, userId: string, failureReason?: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { order: true },
    });

    if (!delivery) {
      throw new NotFoundException('Entrega não encontrada');
    }

    if (delivery.deliveryPersonId !== userId) {
      throw new BadRequestException('Você não é o entregador desta entrega');
    }

    const updateData: any = { status };

    if (status === DeliveryStatus.PICKED_UP) {
      updateData.pickedUpAt = new Date();
    } else if (status === DeliveryStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
      updateData.actualTime = Math.round(
        (Date.now() - delivery.createdAt.getTime()) / 60000,
      );
    } else if (status === DeliveryStatus.FAILED) {
      updateData.failureReason = failureReason || 'Não especificado';
    }

    const updatedDelivery = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: updateData,
    });

    if (status === DeliveryStatus.DELIVERED) {
      await this.prisma.order.update({
        where: { id: delivery.orderId },
        data: {
          status: OrderStatus.DELIVERED,
          deliveredAt: new Date(),
        },
      });
      await this.prisma.orderStatusHistory.create({
        data: {
          orderId: delivery.orderId,
          status: OrderStatus.DELIVERED,
          changedBy: userId,
          notes: 'Pedido entregue com sucesso',
        },
      });
    }

    return updatedDelivery;
  }

  async getDeliveryByOrder(orderId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { orderId },
      include: {
        locationHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            deliveryAddress: true,
          },
        },
      },
    });

    if (!delivery) {
      throw new NotFoundException('Entrega não encontrada para este pedido');
    }

    return delivery;
  }

  async rateDelivery(deliveryId: string, dto: RateDeliveryDto) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      throw new NotFoundException('Entrega não encontrada');
    }

    if (delivery.status !== DeliveryStatus.DELIVERED) {
      throw new BadRequestException('Só é possível avaliar entregas concluídas');
    }

    if (delivery.rating) {
      throw new BadRequestException('Esta entrega já foi avaliada');
    }

    return this.prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        rating: dto.rating,
        ratingComment: dto.comment,
      },
    });
  }
}
