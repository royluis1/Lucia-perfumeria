import { Prisma, ProductGender } from '@prisma/client';

export const publicProductSelect = {
  id: true,
  slug: true,
  name: true,
  brand: true,
  description: true,
  price: true,
  weightGrams: true,
  category: true,
  gender: true,
  imageUrl: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  brandRef: { select: { name: true, slug: true } },
  categories: {
    select: { category: { select: { name: true, slug: true } } },
    orderBy: { position: 'asc' as const },
  },
  images: {
    select: { id: true, url: true, alt: true, position: true },
    orderBy: { position: 'asc' as const },
  },
} satisfies Prisma.ProductSelect;

export type PublicProductRow = Prisma.ProductGetPayload<{ select: typeof publicProductSelect }>;

export const publicProductListSelect = {
  id: true,
  slug: true,
  name: true,
  brand: true,
  price: true,
  gender: true,
  imageUrl: true,
  brandRef: { select: { slug: true } },
  images: {
    select: { id: true, url: true, alt: true },
    orderBy: { position: 'asc' as const },
  },
} satisfies Prisma.ProductSelect;

export type PublicProductListRow = Prisma.ProductGetPayload<{ select: typeof publicProductListSelect }>;

export function toPublicProduct(row: PublicProductRow): PublicProduct {
  const { brandRef, categories, ...product } = row;
  return {
    ...product,
    price: product.price.toString(),
    gender: product.gender ?? null,
    brandSlug: brandRef?.slug ?? null,
    categories: (categories ?? []).map((item) => item.category),
  };
}

export function toPublicProductList(row: PublicProductListRow): PublicProductSummary {
  const { brandRef, ...product } = row;
  return {
    ...product,
    price: product.price.toString(),
    gender: product.gender ?? null,
    brandSlug: brandRef?.slug ?? null,
  };
}

export interface PublicProductImage {
  id: string;
  url: string;
  alt: string | null;
  position: number;
}

export interface PublicProductCategory {
  name: string;
  slug: string;
}

export interface PublicProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  description: string;
  price: string;
  weightGrams: number;
  category: string;
  gender: ProductGender | null;
  brandSlug: string | null;
  categories: PublicProductCategory[];
  imageUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  images: PublicProductImage[];
}

export interface PublicProductSummary {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: string;
  gender: ProductGender | null;
  brandSlug: string | null;
  imageUrl: string | null;
  images: Array<{ id: string; url: string; alt: string | null }>;
}

export interface PaginatedProducts {
  data: PublicProductSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
