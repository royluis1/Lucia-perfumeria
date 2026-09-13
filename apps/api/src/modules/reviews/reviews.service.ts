import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ProductReviews, PublicReview } from './review.types';

const publicReviewSelect = {
  id: true,
  rating: true,
  comment: true,
  isVerifiedPurchase: true,
  createdAt: true,
  user: { select: { name: true } },
} satisfies Prisma.ReviewSelect;

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findApprovedByProduct(productId: string): Promise<ProductReviews> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const reviews = await this.prisma.review.findMany({
      where: { productId, isApproved: true },
      select: publicReviewSelect,
      orderBy: { createdAt: 'desc' },
    });
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;
    for (const review of reviews) {
      distribution[review.rating as 1 | 2 | 3 | 4 | 5] += 1;
      totalRating += review.rating;
    }

    return {
      data: reviews as PublicReview[],
      total: reviews.length,
      averageRating: reviews.length ? Number((totalRating / reviews.length).toFixed(2)) : 0,
      distribution,
    };
  }

  async create(userId: string, productId: string, dto: CreateReviewDto): Promise<PublicReview> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const eligibleOrderItem = await this.prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId,
          status: { in: ['CONFIRMED', 'SHIPPED', 'DELIVERED'] },
        },
      },
      select: { id: true },
    });
    if (!eligibleOrderItem) {
      throw new ForbiddenException('Only customers with a confirmed purchase can review this product');
    }

    const existingReview = await this.prisma.review.findFirst({
      where: {
        userId,
        productId,
        OR: [{ isApproved: false }, { isApproved: true }],
      },
      select: { id: true },
    });
    if (existingReview) {
      throw new ConflictException('You already have a pending or approved review for this product');
    }

    return this.prisma.review.create({
      data: {
        userId,
        productId,
        rating: dto.rating,
        comment: dto.comment.trim(),
        isApproved: false,
        isVerifiedPurchase: true,
      },
      select: publicReviewSelect,
    }) as Promise<PublicReview>;
  }
}
