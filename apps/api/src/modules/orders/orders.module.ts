import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { ShippingModule } from '../shipping/shipping.module';

@Module({
  imports: [PrismaModule, AuthModule, ShippingModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
