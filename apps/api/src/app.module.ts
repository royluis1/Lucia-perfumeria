import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './modules/products/products.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { ReviewsModule } from './modules/reviews/reviews.module';

@Module({
  imports: [PrismaModule, AuthModule, ProductsModule, CartModule, OrdersModule, ShippingModule, ReviewsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}