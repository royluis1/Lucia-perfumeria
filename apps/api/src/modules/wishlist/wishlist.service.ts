import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const publicProductSelect = {
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
} satisfies Prisma.ProductSelect;

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const items = await this.prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { product: { select: publicProductSelect }, createdAt: true },
    });
    return items.map((item) => ({
      product: { ...item.product, price: item.product.price.toString() },
      addedAt: item.createdAt,
    }));
  }

  async add(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    const existing = await this.prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('El producto ya está en tu lista');
    }

    await this.prisma.wishlistItem.create({ data: { userId, productId } });
    return { ok: true };
  }

  async remove(userId: string, productId: string) {
    const existing = await this.prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('El producto no está en tu lista');
    }

    await this.prisma.wishlistItem.delete({ where: { id: existing.id } });
    return { ok: true };
  }
}