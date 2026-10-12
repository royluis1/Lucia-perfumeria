import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
import { timingSafeEqual } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { LocalPaymentEvent, LocalPaymentWebhookDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createPreference(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId, status: 'PENDING' },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Orden pendiente no encontrada');
    const total = this.recalculateTotal(order);
    if (!order.total.equals(total)) {
      throw new ConflictException('El total de la orden no coincide con sus items');
    }
    if (order.paymentStatus !== PaymentStatus.PENDING) {
      throw new ConflictException('La orden ya tiene un estado de pago no pendiente');
    }

    const preference = await this.prisma.paymentPreference.upsert({
      where: { orderId: order.id },
      create: { orderId: order.id, total, sandbox: true, status: PaymentStatus.PENDING },
      update: { total, status: PaymentStatus.PENDING, sandbox: true },
    });

    return {
      id: preference.id,
      orderId: preference.orderId,
      total: preference.total.toString(),
      status: 'pending',
      sandbox: true,
      message: 'Preferencia local de sandbox; no se contactó ningún proveedor de pagos.',
    };
  }

  async receiveLocalWebhook(
    idempotencyKey: string | undefined,
    webhookSecret: string | undefined,
    body: LocalPaymentWebhookDto,
  ) {
    const key = idempotencyKey?.trim();
    if (!key || key.length > 128) {
      throw new BadRequestException('Idempotency-Key requerido');
    }
    if (process.env.MERCADOPAGO_ACCESS_TOKEN) {
      throw new ServiceUnavailableException(
        'El proveedor de pagos no está integrado; no se aceptan webhooks externos',
      );
    }
    if (body.event !== LocalPaymentEvent.PAYMENT || body.sandbox !== true) {
      throw new BadRequestException('Sólo se aceptan eventos locales de prueba en sandbox');
    }
    this.assertWebhookSecret(webhookSecret);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.paymentEvent.findUnique({ where: { idempotencyKey: key } });
        if (existing) {
          return { accepted: true, duplicate: true, eventId: existing.id, status: existing.status };
        }

        const preference = await tx.paymentPreference.findUnique({
          where: { id: body.preferenceId },
        });
        if (!preference || !preference.sandbox) {
          throw new NotFoundException('Preferencia local de sandbox no encontrada');
        }

        const status = body.status as PaymentStatus;
        const event = await tx.paymentEvent.create({
          data: {
            idempotencyKey: key,
            eventType: body.event,
            preferenceId: preference.id,
            orderId: preference.orderId,
            status,
          },
        });
        await tx.paymentPreference.update({
          where: { id: preference.id },
          data: { status },
        });
        await tx.order.update({
          where: { id: preference.orderId },
          data: { paymentStatus: status },
        });

        return { accepted: true, duplicate: false, eventId: event.id, status };
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        const existing = await this.prisma.paymentEvent.findUnique({
          where: { idempotencyKey: key },
        });
        if (existing) return { accepted: true, duplicate: true, eventId: existing.id, status: existing.status };
      }
      throw error;
    }
  }

  private recalculateTotal(order: {
    subtotal: Prisma.Decimal;
    shippingCost: Prisma.Decimal;
    items: Array<{ quantity: number; unitPrice: Prisma.Decimal; subtotal: Prisma.Decimal }>;
  }) {
    const itemsTotal = order.items.reduce(
      (sum, item) => {
        const lineTotal = item.unitPrice.mul(item.quantity);
        if (item.quantity < 1 || !item.subtotal.equals(lineTotal)) {
          throw new ConflictException('Los items de la orden no son válidos');
        }
        return sum.add(lineTotal);
      },
      new Prisma.Decimal(0),
    );
    if (!itemsTotal.equals(order.subtotal)) {
      throw new ConflictException('El subtotal de la orden no coincide con sus items');
    }
    return itemsTotal.add(order.shippingCost);
  }

  private isUniqueConstraintError(error: unknown): error is { code: string } {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
  }

  private assertWebhookSecret(provided: string | undefined): void {
    const expected = process.env.PAYMENTS_WEBHOOK_SECRET;
    if (!expected) {
      throw new ServiceUnavailableException(
        'PAYMENTS_WEBHOOK_SECRET no está configurado; no se aceptan webhooks',
      );
    }
    if (!provided) {
      throw new UnauthorizedException('Falta X-Webhook-Secret');
    }
    const expectedBuffer = Buffer.from(expected);
    const providedBuffer = Buffer.from(provided);
    if (
      expectedBuffer.length !== providedBuffer.length ||
      !timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
      throw new UnauthorizedException('X-Webhook-Secret inválido');
    }
  }
}
