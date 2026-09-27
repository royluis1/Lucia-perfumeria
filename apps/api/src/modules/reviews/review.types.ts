export interface PublicReview {
  id: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: Date;
  user: {
    name: string;
  };
}

export interface ProductReviews {
  data: PublicReview[];
  total: number;
  averageRating: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}
