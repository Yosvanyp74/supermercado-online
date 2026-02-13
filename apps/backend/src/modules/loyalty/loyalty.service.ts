import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoyaltyTransactionType } from '@prisma/client';

@Injectable()
export class LoyaltyService {
  constructor(private prisma: PrismaService) {}

  async getAccount(userId: string) {
    let account = await this.prisma.loyaltyAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      account = await this.prisma.loyaltyAccount.create({
        data: { userId },
      });
    }

    return account;
  }

  async getTransactions(
    userId: string,
    params: { page?: number; limit?: number },
  ) {
    const account = await this.getAccount(userId);
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const [transactions, total] = await this.prisma.$transaction([
      this.prisma.loyaltyTransaction.findMany({
        where: { accountId: account.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.loyaltyTransaction.count({
        where: { accountId: account.id },
      }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async earnPoints(userId: string, orderId: string, amount: number) {
    const account = await this.getAccount(userId);
    const points = Math.floor(amount);

    if (points <= 0) return account;

    await this.prisma.$transaction([
      this.prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          points: { increment: points },
          totalEarned: { increment: points },
        },
      }),
      this.prisma.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          type: LoyaltyTransactionType.EARNED,
          points,
          description: `Pontos ganhos pelo pedido`,
          referenceId: orderId,
          referenceType: 'ORDER',
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { loyaltyPoints: { increment: points } },
      }),
    ]);

    return this.getAccount(userId);
  }

  async redeemPoints(userId: string, rewardId: string) {
    const account = await this.getAccount(userId);

    const reward = await this.prisma.loyaltyReward.findUnique({
      where: { id: rewardId },
    });

    if (!reward) {
      throw new NotFoundException('Recompensa não encontrada');
    }

    if (!reward.isActive) {
      throw new BadRequestException('Recompensa indisponível');
    }

    if (account.points < reward.pointsCost) {
      throw new BadRequestException(
        `Pontos insuficientes. Necessário: ${reward.pointsCost}, disponível: ${account.points}`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          points: { decrement: reward.pointsCost },
          totalRedeemed: { increment: reward.pointsCost },
        },
      }),
      this.prisma.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          type: LoyaltyTransactionType.REDEEMED,
          points: -reward.pointsCost,
          description: `Resgate: ${reward.name}`,
          referenceId: rewardId,
          referenceType: 'REWARD',
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { loyaltyPoints: { decrement: reward.pointsCost } },
      }),
    ]);

    return {
      message: 'Recompensa resgatada com sucesso',
      reward,
      pointsUsed: reward.pointsCost,
      remainingPoints: account.points - reward.pointsCost,
    };
  }

  async getRewards() {
    return this.prisma.loyaltyReward.findMany({
      where: { isActive: true },
      orderBy: { pointsCost: 'asc' },
    });
  }
}
