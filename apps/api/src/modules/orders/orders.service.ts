import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ShippingAddress } from './dto/create-order.dto';

const orderInclude = {
  items: {
    include: {
      product: { select: { id: true, slug: true, name: true, brand: true, sku: true } },
    },
    orderBy: { id: 'asc' as const },
  },
} satisfies Prisma.OrderInclude;

type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, shippingAddress: ShippingAddress) {
    try {
      const order = await this.prisma.$transaction(async (tx) => {
        const cart = await tx.cart.findUnique({
          where: { userId },
          include: { items: { include: { product: true }, orderBy: { id: 'asc' } } },
        });
        if (!cart || cart.items.length === 0) throw new BadRequestException('El carrito está vacío');

        const lines = cart.items.map((item) => {
          if (!item.product.isActive) throw new BadRequestException(`Producto no disponible: ${item.product.name}`);
          if (item.quantity < 1) throw new BadRequestException('Cantidad inválida en el carrito');
          return {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.product.price,
            subtotal: item.product.price.mul(item.quantity),
          };
        });
        const subtotal = lines.reduce((sum, line) => sum.add(line.subtotal), new Prisma.Decimal(0));

        for (const line of lines) {
          const updated = await tx.product.updateMany({
            where: { id: line.productId, isActive: true, stock: { gte: line.quantity } },
            data: { stock: { decrement: line.quantity } },
          });
          if (updated.count !== 1) throw new BadRequestException('Stock insuficiente');
        }

        const created = await tx.order.create({
          data: {
            userId,
            subtotal,
            shippingCost: new Prisma.Decimal(0),
            total: subtotal,
            shippingAddress: shippingAddress as unknown as Prisma.InputJsonValue,
            items: { create: lines },
          },
          include: orderInclude,
        });
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        return created;
      });
      return this.toResponse(order);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw error;
    }
  }

  async findMine(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((order) => this.toResponse(order));
  }

  async findOne(userId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Orden no encontrada');
    return this.toResponse(order);
  }

  private toResponse(order: OrderWithItems) {
    return {
      ...order,
      subtotal: order.subtotal.toString(),
      shippingCost: order.shippingCost.toString(),
      total: order.total.toString(),
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        subtotal: item.subtotal.toString(),
        product: item.product,
      })),
    };
  }
}
