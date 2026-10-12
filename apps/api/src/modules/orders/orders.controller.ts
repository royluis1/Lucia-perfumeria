import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateOrderDto, parseShippingAddress } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() body: CreateOrderDto) {
    return this.ordersService.create(request.userId, parseShippingAddress(body?.shippingAddress));
  }

  @Get()
  findMine(@Req() request: AuthenticatedRequest) {
    return this.ordersService.findMine(request.userId);
  }

  @Get(':id')
  findOne(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.ordersService.findOne(request.userId, id);
  }
}
