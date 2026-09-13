import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CartItemDto } from './dto/cart.dto';

const cartInclude = {
  items: {
    include: {
      product: {
        select: { id: true, slug: true, name: true, brand: true, price: true },
      },
    },
    orderBy: { id: 'asc' as const },
  },
} satisfies Prisma.CartInclude;

type CartWithItems = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    const cart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: cartInclude,
    });
    return this.toResponse(cart);
  }

  async addItem(userId: string, dto: CartItemDto) {
    const quantity = this.validateQuantity(dto.quantity);
    if (typeof dto.productId !== 'string' || !dto.productId.trim()) {
      throw new BadRequestException('productId es requerido');
    }

    const cart = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: dto.productId },
        select: { id: true, isActive: true, stock: true },
      });
      this.validateProduct(product);
      const currentCart = await tx.cart.upsert({
        where: { userId },
        create: { userId },
        update: {},
      });
      const existing = await tx.cartItem.findUnique({
        where: { cartId_productId: { cartId: currentCart.id, productId: dto.productId } },
      });
      const totalQuantity = (existing?.quantity ?? 0) + quantity;
      this.validateStock(product.stock, totalQuantity);
      await tx.cartItem.upsert({
        where: { cartId_productId: { cartId: currentCart.id, productId: dto.productId } },
        create: { cartId: currentCart.id, productId: dto.productId, quantity },
        update: { quantity: totalQuantity },
      });
      return tx.cart.findUniqueOrThrow({ where: { id: currentCart.id }, include: cartInclude });
    });
    return this.toResponse(cart);
  }

  async updateItem(userId: string, productId: string, body: Pick<CartItemDto, 'quantity'>) {
    const quantity = this.validateQuantity(body.quantity);
    const cart = await this.prisma.$transaction(async (tx) => {
      const currentCart = await tx.cart.findUnique({ where: { userId } });
      if (!currentCart) throw new NotFoundException('Carrito no encontrado');
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { id: true, isActive: true, stock: true },
      });
      this.validateProduct(product);
      this.validateStock(product.stock, quantity);
      const item = await tx.cartItem.findUnique({
        where: { cartId_productId: { cartId: currentCart.id, productId } },
      });
      if (!item) throw new NotFoundException('Producto no está en el carrito');
      await tx.cartItem.update({ where: { id: item.id }, data: { quantity } });
      return tx.cart.findUniqueOrThrow({ where: { id: currentCart.id }, include: cartInclude });
    });
    return this.toResponse(cart);
  }

  async removeItem(userId: string, productId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (cart) await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    await this.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({ where: { userId }, select: { id: true } });
      if (cart) await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    });
    return this.getCart(userId);
  }

  private validateQuantity(quantity: unknown): number {
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new BadRequestException('quantity debe ser un entero entre 1 y 99');
    }
    return quantity;
  }

  private validateProduct(product: { isActive: boolean; stock: number } | null): asserts product is { isActive: boolean; stock: number } {
    if (!product || !product.isActive) throw new NotFoundException('Producto no encontrado o inactivo');
  }

  private validateStock(stock: number, quantity: number) {
    if (stock < quantity) throw new BadRequestException('Stock insuficiente');
  }

  private toResponse(cart: CartWithItems) {
    const items = cart.items.map((item) => {
      const unitPrice = item.product.price.toString();
      const subtotal = item.product.price.mul(item.quantity).toString();
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        subtotal,
        product: { ...item.product, price: unitPrice },
      };
    });
    const subtotal = cart.items.reduce(
      (sum, item) => sum.add(item.product.price.mul(item.quantity)),
      new Prisma.Decimal(0),
    ).toString();
    return { id: cart.id, items, subtotal, total: subtotal };
  }
}
