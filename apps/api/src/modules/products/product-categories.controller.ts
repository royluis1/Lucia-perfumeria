import { Controller, Get, Header } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('categories')
export class ProductCategoriesController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
  findAll() {
    return this.productsService.listCategories();
  }
}
