import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ShippingAddress } from './dto/create-order.dto';
import { ShippingService } from '../shipping/shipping.service';
import { MailService } from '../mail/mail.service';
import { PaymentsService } from '../payments/payments.service';

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
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly shippingService: ShippingService,
    private readonly mailService: MailService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async create(userId: string, shippingAddress: ShippingAddress) {
    const order = await this.buildPendingOrder(userId, shippingAddress, true);
    void this.sendOrderConfirmation(userId, order);
    return this.toResponse(order);
  }

  async createWithPayment(userId: string, shippingAddress: ShippingAddress) {
    const order = await this.buildPendingOrder(userId, shippingAddress, false);
    try {
      const preference = await this.paymentsService.createPreference(userId, order.id);
      if (!preference.checkoutUrl) {
        throw new ServiceUnavailableException('Los pagos online todavía no están configurados');
      }
      await this.clearUserCart(userId);
      void this.sendOrderConfirmation(userId, order);
      return {
        order: this.toResponse(order),
        preferenceId: preference.id,
        checkoutUrl: preference.checkoutUrl,
        sandbox: preference.sandbox,
      };
    } catch (error) {
      const rolledBack = await this.rollbackPendingOrder(order);
      this.logger.error(
        `No se pudo iniciar el pago de la orden ${order.id}: ${error instanceof Error ? error.message : 'error desconocido'}`,
      );
      if (!rolledBack) {
        throw new ServiceUnavailableException(
          'No se pudo iniciar el pago. Tu pedido quedó pendiente en "Mis pedidos"; podés reintentar el pago desde ahí.',
        );
      }
      const reason =
        error instanceof Error && error.message ? error.message : 'intentá de nuevo en unos minutos';
      throw new ServiceUnavailableException(
        `${reason}. El pedido no se creó y tu carrito quedó intacto.`,
      );
    }
  }

  private async buildPendingOrder(
    userId: string,
    shippingAddress: ShippingAddress,
    clearCart: boolean,
  ) {
    return this.prisma.$transaction(async (tx) => {
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
      if (clearCart) await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return created;
    });
  }

  private async clearUserCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId }, select: { id: true } });
    if (cart) await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  private async rollbackPendingOrder(order: OrderWithItems): Promise<boolean> {
    try {
      await this.prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
        await tx.order.delete({ where: { id: order.id } });
      });
      return true;
    } catch (rollbackError) {
      this.logger.error(
        `No se pudo revertir la orden ${order.id} tras un pago fallido: ${rollbackError instanceof Error ? rollbackError.message : 'error desconocido'}`,
      );
      return false;
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
