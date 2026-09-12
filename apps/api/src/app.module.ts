import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './modules/products/products.module';
import { CartModule } from './modules/cart/cart.module';

@Module({
  imports: [PrismaModule, AuthModule, ProductsModule, CartModule],
  controllers: [],
  providers: [],
})
export class AppModule {}