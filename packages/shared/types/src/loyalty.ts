export interface LoyaltyAccount {
  id: string;
  userId: string;
  points: number;
  totalEarned: number;
  totalRedeemed: number;
  tier: LoyaltyTier;
  createdAt: Date;
  updatedAt: Date;
}

export enum LoyaltyTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

export enum LoyaltyTransactionType {
  EARNED = 'EARNED',
  REDEEMED = 'REDEEMED',
  EXPIRED = 'EXPIRED',
  ADJUSTED = 'ADJUSTED',
}

export interface LoyaltyTransaction {
  id: string;
  accountId: string;
  type: LoyaltyTransactionType;
  points: number;
  description: string;
  referenceId?: string;
  referenceType?: string;
  createdAt: Date;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  type: 'DISCOUNT' | 'FREE_PRODUCT' | 'FREE_SHIPPING';
  value: number;
  isActive: boolean;
  imageUrl?: string;
}

export interface RedeemRewardDto {
  rewardId: string;
}
