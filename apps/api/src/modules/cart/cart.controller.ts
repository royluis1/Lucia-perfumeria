import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CartItemDto } from './dto/cart.dto';
import { CartService } from './cart.service';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Req() request: AuthenticatedRequest) {
    return this.cartService.getCart(request.userId);
  }

  @Post('items')
  addItem(@Req() request: AuthenticatedRequest, @Body() body: CartItemDto) {
    return this.cartService.addItem(request.userId, body);
  }

  @Patch('items/:productId')
  updateItem(
    @Req() request: AuthenticatedRequest,
    @Param('productId') productId: string,
    @Body() body: Pick<CartItemDto, 'quantity'>,
  ) {
    return this.cartService.updateItem(request.userId, productId, body);
  }

  @Delete('items/:productId')
  removeItem(
    @Req() request: AuthenticatedRequest,
    @Param('productId') productId: string,
  ) {
    return this.cartService.removeItem(request.userId, productId);
  }

  @Delete()
  clearCart(@Req() request: AuthenticatedRequest) {
    return this.cartService.clearCart(request.userId);
  }
}
