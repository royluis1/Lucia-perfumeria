import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { LocalPaymentEvent, LocalPaymentWebhookDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  getCheckoutStatus() {
    const configured = Boolean(
      process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() &&
      process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim() &&
      process.env.WEB_APP_URL?.trim() &&
      process.env.API_PUBLIC_URL?.trim(),
    );
    return { configured, provider: configured ? 'mercadopago' : null };
  }

  async createPreference(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId, status: 'PENDING' },
      include: { items: { include: { product: { select: { name: true, brand: true, sku: true } } } } },
    });
    if (!order) throw new NotFoundException('Orden pendiente no encontrada');
    const total = this.recalculateTotal(order);
    if (!order.total.equals(total)) {
      throw new ConflictException('El total de la orden no coincide con sus items');
    }
    if (order.paymentStatus !== PaymentStatus.PENDING) {
      throw new ConflictException('La orden ya tiene un estado de pago no pendiente');
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
    const sandbox = !accessToken || accessToken.startsWith('TEST-');
    const preference = await this.prisma.paymentPreference.upsert({
      where: { orderId: order.id },
      create: { orderId: order.id, total, sandbox, status: PaymentStatus.PENDING },
      update: { total, status: PaymentStatus.PENDING, sandbox },
    });

    if (accessToken) {
      const checkoutUrl = await this.createMercadoPagoCheckout(order, accessToken);
      return { id: preference.id, orderId: preference.orderId, total: preference.total.toString(), status: 'pending', sandbox, provider: 'mercadopago', checkoutUrl };
    }

    return {
      id: preference.id,
      orderId: preference.orderId,
      total: preference.total.toString(),
      status: 'pending',
      sandbox: true,
      message: 'Preferencia local de sandbox; no se contactó ningún proveedor de pagos.',
    };
  }

  async receiveMercadoPagoWebhook(dataId: string | undefined, xSignature: string | undefined, xRequestId: string | undefined) {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
    if (!accessToken || !secret) throw new ServiceUnavailableException('Mercado Pago no está configurado');
    if (!dataId || !this.isValidMercadoPagoSignature(dataId, xSignature, xRequestId, secret)) {
      throw new UnauthorizedException('Webhook de Mercado Pago inválido');
    }
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!response.ok) throw new ServiceUnavailableException('No se pudo verificar el pago en Mercado Pago');
    const payment = await response.json() as { id?: number | string; status?: string; external_reference?: string };
    const orderId = payment.external_reference;
    const paymentId = payment.id?.toString();
    if (!orderId || !paymentId || !payment.status) throw new BadRequestException('Notificación de pago incompleta');
    const preference = await this.prisma.paymentPreference.findUnique({ where: { orderId } });
    if (!preference) throw new NotFoundException('Orden asociada al pago no encontrada');
    const status = this.mapMercadoPagoStatus(payment.status);
    const idempotencyKey = `mercadopago:${paymentId}:${status}`;
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.paymentEvent.findUnique({ where: { idempotencyKey } });
      if (existing) return;
      await tx.paymentEvent.create({ data: { idempotencyKey, eventType: 'mercadopago.payment', preferenceId: preference.id, orderId, status } });
      await tx.paymentPreference.update({ where: { id: preference.id }, data: { status } });
      await tx.order.update({ where: { id: orderId }, data: { paymentStatus: status } });
    });
    return { accepted: true };
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

  private async createMercadoPagoCheckout(order: { id: string; shippingCost: Prisma.Decimal; items: Array<{ quantity: number; unitPrice: Prisma.Decimal; product: { name: string; brand: string; sku: string } }> }, accessToken: string) {
    const webAppUrl = process.env.WEB_APP_URL?.trim();
    const apiPublicUrl = process.env.API_PUBLIC_URL?.trim();
    if (!webAppUrl || !apiPublicUrl) throw new ServiceUnavailableException('WEB_APP_URL y API_PUBLIC_URL son requeridas para cobrar con Mercado Pago');
    const items = order.items.map((item) => ({ id: item.product.sku, title: `${item.product.brand} ${item.product.name}`, quantity: item.quantity, currency_id: 'ARS', unit_price: Number(item.unitPrice.toString()) }));
    if (!order.shippingCost.isZero()) items.push({ id: `shipping-${order.id}`, title: 'Envío', quantity: 1, currency_id: 'ARS', unit_price: Number(order.shippingCost.toString()) });
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, external_reference: order.id, auto_return: 'approved', back_urls: { success: `${webAppUrl}/account/orders?payment=success`, failure: `${webAppUrl}/account/orders?payment=failure`, pending: `${webAppUrl}/account/orders?payment=pending` }, notification_url: `${apiPublicUrl}/payments/mercadopago/webhook` }),
    });
    if (!response.ok) throw new ServiceUnavailableException('No se pudo iniciar el checkout de Mercado Pago');
    const preference = await response.json() as { init_point?: string; sandbox_init_point?: string };
    const checkoutUrl = preference.sandbox_init_point ?? preference.init_point;
    if (!checkoutUrl) throw new ServiceUnavailableException('Mercado Pago no devolvió una URL de pago');
    return checkoutUrl;
  }

  private mapMercadoPagoStatus(status: string): PaymentStatus {
    if (status === 'approved') return PaymentStatus.APPROVED;
    if (status === 'rejected' || status === 'cancelled') return PaymentStatus.REJECTED;
    if (status === 'refunded') return PaymentStatus.REFUNDED;
    if (status === 'charged_back') return PaymentStatus.CHARGED_BACK;
    return PaymentStatus.IN_PROCESS;
  }

  private isValidMercadoPagoSignature(dataId: string, xSignature: string | undefined, xRequestId: string | undefined, secret: string) {
    if (!xSignature) return false;
    const values = Object.fromEntries(xSignature.split(',').map((part) => { const [key, value] = part.trim().split('=', 2); return [key, value]; }));
    const timestamp = values.ts;
    const signature = values.v1;
    if (!timestamp || !signature) return false;
    const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId ?? ''};ts:${timestamp};`;
    const calculated = createHmac('sha256', secret).update(manifest).digest('hex');
    const expected = Buffer.from(calculated);
    const received = Buffer.from(signature);
    return expected.length === received.length && timingSafeEqual(expected, received);
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
