import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { BrandsService } from './brands.service';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
  findAll() {
    return this.brandsService.findAll();
  }

  @Get(':slug')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
  findBySlug(
    @Param('slug') slug: string,
    @Query('gender') gender?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.brandsService.findBySlug(slug, { gender, sort, page, limit });
  }
}
