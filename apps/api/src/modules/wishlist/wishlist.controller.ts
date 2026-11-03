import { Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WishlistService } from './wishlist.service';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.wishlistService.list(request.userId);
  }

  @Post(':productId')
  add(@Req() request: AuthenticatedRequest, @Param('productId') productId: string) {
    return this.wishlistService.add(request.userId, productId);
  }

  @Delete(':productId')
  remove(@Req() request: AuthenticatedRequest, @Param('productId') productId: string) {
    return this.wishlistService.remove(request.userId, productId);
  }
}