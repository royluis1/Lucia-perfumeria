import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizeName, parseProductGender } from '../../common/catalog.util';
import { ProductQueryDto } from './dto/product-query.dto';
import {
  PaginatedProducts,
  PublicProduct,
  publicProductListSelect,
  publicProductSelect,
  toPublicProduct,
  toPublicProductList,
} from './product.types';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProductQueryDto): Promise<PaginatedProducts> {
    const page = this.parsePositiveInteger(query.page, 1, 'page');
    const limit = this.parsePositiveInteger(query.limit, 20, 'limit');
    if (limit > 100) {
      throw new BadRequestException('limit must be between 1 and 100');
    }

    const search = query.search?.trim();
    const category = query.category?.trim();
    const brand = query.brand?.trim();
    const gender = query.gender?.trim();
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(category
        ? {
            categories: {
              some: {
                category: {
                  OR: [
                    { slug: category },
                    { normalizedName: normalizeName(category) },
                    { name: { equals: category, mode: 'insensitive' as const } },
                  ],
                },
              },
            },
          }
        : {}),
      ...(brand ? { brand: { equals: brand, mode: 'insensitive' } } : {}),
      ...(gender ? { gender: parseProductGender(gender) } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { brand: { contains: search, mode: 'insensitive' } },
              { category: { contains: search, mode: 'insensitive' } },
              { slug: { contains: search, mode: 'insensitive' } },
              { categories: { some: { category: { name: { contains: search, mode: 'insensitive' } } } } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      query.sort === 'price_asc'
        ? { price: 'asc' }
        : query.sort === 'price_desc'
          ? { price: 'desc' }
          : query.sort === 'name'
            ? { name: 'asc' }
            : { createdAt: 'desc' };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: publicProductListSelect,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products.map((product) => toPublicProductList(product)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findBySlug(slug: string): Promise<PublicProduct> {
    const product = await this.prisma.product.findFirst({
      where: { slug, isActive: true },
      select: publicProductSelect,
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return toPublicProduct(product);
  }

  async listCategories() {
    const categories = await this.prisma.category.findMany({
      where: { products: { some: { product: { isActive: true } } } },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { products: { where: { product: { isActive: true } } } } },
      },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    });
    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      productCount: category._count.products,
    }));
  }

  private parsePositiveInteger(value: string | undefined, fallback: number, field: string): number {
    if (value === undefined || value.trim() === '') {
      return fallback;
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new BadRequestException(`${field} must be a positive integer`);
    }
    return parsed;
  }
}
