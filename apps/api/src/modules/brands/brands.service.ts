import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { parseProductGender } from '../../common/catalog.util';
import {
  PaginatedProducts,
  publicProductListSelect,
  toPublicProductList,
} from '../products/product.types';

export interface BrandSummary {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

export interface BrandDetail extends BrandSummary {
  data: PaginatedProducts['data'];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<BrandSummary[]> {
    const brands = await this.prisma.brand.findMany({
      where: { products: { some: { isActive: true } } },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { products: { where: { isActive: true } } } },
      },
      orderBy: { name: 'asc' },
    });
    return brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      productCount: brand._count.products,
    }));
  }

  async findBySlug(
    slug: string,
    query: { gender?: string; sort?: string; page?: string; limit?: string },
  ): Promise<BrandDetail> {
    const brand = await this.prisma.brand.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true },
    });
    if (!brand) throw new NotFoundException('Brand not found');

    const page = this.parsePositiveInteger(query.page, 1, 'page');
    const limit = this.parsePositiveInteger(query.limit, 20, 'limit');
    if (limit > 100) {
      throw new BadRequestException('limit must be between 1 and 100');
    }

    const gender = query.gender?.trim();
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      brandId: brand.id,
      ...(gender ? { gender: parseProductGender(gender) } : {}),
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
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      productCount: total,
      data: products.map((product) => toPublicProductList(product)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
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
