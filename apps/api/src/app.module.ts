import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './modules/products/products.module';
import { BrandsModule } from './modules/brands/brands.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { AdminModule } from './modules/admin/admin.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { MailModule } from './modules/mail/mail.module';
import { CancellationModule } from './modules/cancellation/cancellation.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { HealthModule } from './modules/health/health.module';
import { HomeModule } from './modules/home/home.module';

@Module({
  imports: [PrismaModule, AuthModule, ProductsModule, BrandsModule, CartModule, OrdersModule, ShippingModule, ReviewsModule, AdminModule, PaymentsModule, MailModule, CancellationModule, WishlistModule, HealthModule, HomeModule],
  controllers: [],
  providers: [],
})
export class AppModule {}