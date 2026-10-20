import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { publicProductSelect, toPublicProduct } from '../products/product.types';

const FEATURED_LIMIT = 6;
const FALLBACK_LIMIT = 3;

@Injectable()
export class HomeService {
  constructor(private readonly prisma: PrismaService) {}

  async getHome() {
    const [heroRow, featuredRows, categoryRows] = await Promise.all([
      this.prisma.homeHero.findUnique({
        where: { id: 'home' },
        include: { product: { select: publicProductSelect } },
      }),
      this.prisma.product.findMany({
        where: { isActive: true, stock: { gt: 0 }, featured: true },
        orderBy: [{ featuredOrder: 'asc' }, { createdAt: 'desc' }],
        take: FEATURED_LIMIT,
        select: publicProductSelect,
      }),
      this.prisma.category.findMany({
        select: { name: true },
        orderBy: [{ position: 'asc' }, { name: 'asc' }],
      }),
    ]);

    let featured = featuredRows;
    if (featured.length === 0) {
      featured = await this.prisma.product.findMany({
        where: { isActive: true, stock: { gt: 0 } },
        orderBy: { createdAt: 'desc' },
        take: FALLBACK_LIMIT,
        select: publicProductSelect,
      });
    }

    const heroProduct = heroRow?.product ?? null;

    return {
      hero: {
        product: heroProduct ? toPublicProduct(heroProduct) : null,
        imageUrl: heroRow?.imageUrl ?? heroProduct?.imageUrl ?? null,
        title: heroRow?.title ?? null,
        subtitle: heroRow?.subtitle ?? null,
        buttonLabel: heroRow?.buttonLabel ?? null,
      },
      featured: featured.map((product) => toPublicProduct(product)),
      categories: categoryRows.map((row) => row.name),
    };
  }
}
