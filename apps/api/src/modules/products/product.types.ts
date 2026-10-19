import { Prisma } from '@prisma/client';

export const publicProductSelect = {
  id: true,
  slug: true,
  name: true,
  brand: true,
  description: true,
  price: true,
  weightGrams: true,
  category: true,
  imageUrl: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  images: {
    select: { id: true, url: true, alt: true, position: true },
    orderBy: { position: 'asc' as const },
  },
} satisfies Prisma.ProductSelect;

export type PublicProductRow = Prisma.ProductGetPayload<{ select: typeof publicProductSelect }>;

export function toPublicProduct(product: PublicProductRow): PublicProduct {
  return { ...product, price: product.price.toString() };
}

export interface PublicProductImage {
  id: string;
  url: string;
  alt: string | null;
  position: number;
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
  imageUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  images: PublicProductImage[];
}

export interface PaginatedProducts {
  data: PublicProduct[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
