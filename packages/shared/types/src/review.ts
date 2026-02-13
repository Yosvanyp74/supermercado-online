export interface Review {
  id: string;
  userId: string;
  productId: string;
  orderId?: string;
  rating: number;
  title?: string;
  comment?: string;
  isApproved: boolean;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  images: string[];
  response?: string;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReviewDto {
  productId: string;
  orderId?: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
}

export interface ReviewSummary {
  productId: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}
