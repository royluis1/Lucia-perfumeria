import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProductCategoriesController } from './product-categories.controller';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProductsController, ProductCategoriesController],
  providers: [ProductsService],
})
export class ProductsModule {}
