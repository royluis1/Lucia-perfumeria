import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ShippingAddress } from './dto/create-order.dto';
import { ShippingService } from '../shipping/shipping.service';
import { MailService } from '../mail/mail.service';

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly shippingService: ShippingService,
    private readonly mailService: MailService,
  ) {}

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
        const weightGrams = cart.items.reduce(
          (sum, item) => sum + item.product.weightGrams * item.quantity,
          0,
        );
        const shippingQuote = this.shippingService.quote({
          postalCode: shippingAddress.postalCode,
          weightGrams,
          declaredValue: Number(subtotal.toString()),
        });
        const shippingCost = new Prisma.Decimal(shippingQuote.cost);

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
            shippingCost,
            total: subtotal.add(shippingCost),
            shippingAddress: shippingAddress as unknown as Prisma.InputJsonValue,
            items: { create: lines },
          },
          include: orderInclude,
        });
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        return created;
      });
      void this.sendOrderConfirmation(userId, order);
      return this.toResponse(order);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw error;
    }
  }

  private async sendOrderConfirmation(userId: string, order: OrderWithItems) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });
      if (!user) return;
      const formattedTotal = Number(order.total.toString()).toLocaleString('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0,
      });
      const itemsHtml = order.items
        .map(
          (item) =>
            `<tr><td style="padding:8px 0">${item.quantity} × ${item.product.name}</td><td style="padding:8px 0;text-align:right">${Number(item.subtotal.toString()).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })}</td></tr>`,
        )
        .join('');
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
          <h1 style="text-transform:uppercase;letter-spacing:2px">Lucía</h1>
          <p>Hola ${user.name}, ¡gracias por tu compra!</p>
          <p>Recibimos tu orden <strong>#${order.id.slice(0, 8).toUpperCase()}</strong> y la estamos preparando.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            ${itemsHtml}
            <tr><td style="padding-top:16px;border-top:1px solid #eee"><strong>Total</strong></td><td style="padding-top:16px;border-top:1px solid #eee;text-align:right"><strong>${formattedTotal}</strong></td></tr>
          </table>
          <p style="font-size:12px;color:#666">Podés seguir tu pedido desde tu cuenta en <a href="${process.env.WEB_APP_URL?.trim() || 'http://localhost:3000'}/account/orders">Mis pedidos</a>.</p>
        </div>`;
      await this.mailService.send({
        to: user.email,
        subject: `Confirmación de tu compra #${order.id.slice(0, 8).toUpperCase()}`,
        html,
      });
    } catch {
      // El email no debe romper la creación de la orden
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
