import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CouponType } from '@prisma/client';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async validate(dto: ValidateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: dto.code.toUpperCase() },
    });

    if (!coupon) {
      throw new NotFoundException('Cupom não encontrado');
    }

    if (!coupon.isActive) {
      throw new BadRequestException('Cupom inativo');
    }

    const now = new Date();

    if (coupon.startsAt && now < coupon.startsAt) {
      throw new BadRequestException('Cupom ainda não está válido');
    }

    if (coupon.expiresAt && now > coupon.expiresAt) {
      throw new BadRequestException('Cupom expirado');
    }

    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      throw new BadRequestException('Cupom atingiu o limite de usos');
    }

    if (coupon.minOrderValue && dto.orderTotal < coupon.minOrderValue) {
      throw new BadRequestException(
        `Valor mínimo do pedido para este cupom é R$ ${coupon.minOrderValue.toFixed(2)}`,
      );
    }

    const discount = this.calculateDiscount(coupon, dto.orderTotal);

    return {
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        description: coupon.description,
      },
      discount,
    };
  }

  async findAll(params: { page?: number; limit?: number }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const [coupons, total] = await this.prisma.$transaction([
      this.prisma.coupon.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.coupon.count(),
    ]);

    return {
      data: coupons,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(dto: CreateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({
      where: { code: dto.code.toUpperCase() },
    });

    if (existing) {
      throw new BadRequestException('Já existe um cupom com este código');
    }

    return this.prisma.coupon.create({
      data: {
        code: dto.code.toUpperCase(),
        description: dto.description,
        type: dto.type,
        value: dto.value,
        minOrderValue: dto.minOrderValue,
        maxDiscountValue: dto.maxDiscountValue,
        maxUses: dto.maxUses,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
  }

  async update(id: string, dto: Partial<CreateCouponDto>) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });

    if (!coupon) {
      throw new NotFoundException('Cupom não encontrado');
    }

    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...dto,
        code: dto.code ? dto.code.toUpperCase() : undefined,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
  }

  async remove(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });

    if (!coupon) {
      throw new NotFoundException('Cupom não encontrado');
    }

    await this.prisma.coupon.delete({ where: { id } });

    return { message: 'Cupom removido com sucesso' };
  }

  applyCoupon(
    coupon: { type: CouponType; value: number; maxDiscountValue?: number | null },
    orderTotal: number,
  ): number {
    return this.calculateDiscount(coupon, orderTotal);
  }

  private calculateDiscount(
    coupon: { type: CouponType; value: number; maxDiscountValue?: number | null },
    orderTotal: number,
  ): number {
    let discount = 0;

    switch (coupon.type) {
      case CouponType.PERCENTAGE:
        discount = (orderTotal * coupon.value) / 100;
        break;
      case CouponType.FIXED_AMOUNT:
        discount = coupon.value;
        break;
      case CouponType.FREE_SHIPPING:
        discount = 0;
        break;
    }

    if (coupon.maxDiscountValue && discount > coupon.maxDiscountValue) {
      discount = coupon.maxDiscountValue;
    }

    if (discount > orderTotal) {
      discount = orderTotal;
    }

    return Math.round(discount * 100) / 100;
  }
}
