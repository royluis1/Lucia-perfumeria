import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductQueryDto } from './dto/product-query.dto';
import { PaginatedProducts, PublicProduct } from './product.types';

const publicProductSelect = {
  id: true,
  slug: true,
  name: true,
  brand: true,
  description: true,
  price: true,
  weightGrams: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProductSelect;

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
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { brand: { contains: search, mode: 'insensitive' } },
              { slug: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: publicProductSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products.map((product) => this.toPublicProduct(product)),
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
    return this.toPublicProduct(product);
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

  private toPublicProduct(product: Prisma.ProductGetPayload<{ select: typeof publicProductSelect }>): PublicProduct {
    return { ...product, price: product.price.toString() };
  }
}
