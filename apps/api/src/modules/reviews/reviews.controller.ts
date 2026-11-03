import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('products/:productId/reviews')
  findApproved(@Param('productId') productId: string) {
    return this.reviewsService.findApprovedByProduct(productId);
  }

  @Post('reviews')
  @UseGuards(JwtAuthGuard)
  create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateReviewDto,
  ) {
    return this.reviewsService.create(request.userId, body.productId, body);
  }
}
