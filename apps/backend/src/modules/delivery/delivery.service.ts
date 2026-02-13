import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DeliveryStatus, OrderStatus } from '@prisma/client';
import { AssignDeliveryDto } from './dto/assign-delivery.dto';
import { RateDeliveryDto } from './dto/rate-delivery.dto';

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService) {}

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
