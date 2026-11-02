import { Injectable } from '@nestjs/common';
import { ProductGender } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { publicProductListSelect, publicProductSelect, toPublicProduct, toPublicProductList } from '../products/product.types';

const FEATURED_LIMIT = 6;
const FALLBACK_LIMIT = 3;
const NEWEST_LIMIT = 6;

const GENDER_LINKS = [
  { gender: ProductGender.FEMENINO, label: 'Para ella', value: 'femenino' },
  { gender: ProductGender.MASCULINO, label: 'Para él', value: 'masculino' },
  { gender: ProductGender.UNISEX, label: 'Unisex', value: 'unisex' },
];

@Injectable()
export class HomeService {
  constructor(private readonly prisma: PrismaService) {}

  async getHome() {
    const [heroRow, featuredRows, categoryRows, newestRows, genderRows, brandRows] = await Promise.all([
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
      this.prisma.product.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: NEWEST_LIMIT,
        select: publicProductListSelect,
      }),
      this.prisma.product.groupBy({
        by: ['gender'],
        where: { isActive: true, gender: { not: null } },
        _count: { _all: true },
      }),
      this.prisma.brand.findMany({
        where: { products: { some: { isActive: true } } },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { products: { where: { isActive: true } } } },
        },
        orderBy: { name: 'asc' },
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
      genderCategories: GENDER_LINKS.flatMap((link) => {
        const productCount = genderRows.find((row) => row.gender === link.gender)?._count._all ?? 0;
        return productCount > 0 ? [{ ...link, productCount }] : [];
      }),
      newest: newestRows.map((product) => toPublicProductList(product)),
      brands: brandRows.map((brand) => ({
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        productCount: brand._count.products,
      })),
    };
  }
}
