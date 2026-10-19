import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { timingSafeEqual } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { LocalPaymentEvent, LocalPaymentWebhookDto } from './dto/payment.dto';
import {
  isMercadoPagoConfigured,
  isSandboxToken,
  isTerminalPaymentStatus,
  isValidMercadoPagoSignature,
  mapMercadoPagoStatus,
  readMercadoPagoConfig,
} from './mercadopago.util';

type MercadoPagoPayment = {
  id?: number | string;
  status?: string;
  external_reference?: string;
  transaction_amount?: number;
  currency_id?: string;
};

type CheckoutOrder = {
  id: string;
  shippingCost: Prisma.Decimal;
  user: { email: string; name: string };
  items: Array<{
    quantity: number;
    unitPrice: Prisma.Decimal;
    product: { name: string; brand: string; sku: string };
  }>;
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  getCheckoutStatus() {
    const configured = isMercadoPagoConfigured();
    return { configured, provider: configured ? 'mercadopago' : null };
  }

  async createPreference(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId, status: 'PENDING' },
      include: {
        items: { include: { product: { select: { name: true, brand: true, sku: true } } } },
        user: { select: { email: true, name: true } },
      },
    });
    if (!order) throw new NotFoundException('Orden pendiente no encontrada');
    const total = this.recalculateTotal(order);
    if (!order.total.equals(total)) {
      throw new ConflictException('El total de la orden no coincide con sus items');
    }
    if (order.paymentStatus !== PaymentStatus.PENDING) {
      throw new ConflictException('La orden ya tiene un estado de pago no pendiente');
    }

    const { accessToken } = readMercadoPagoConfig();
    const sandbox = !accessToken || isSandboxToken(accessToken);
    const preference = await this.prisma.paymentPreference.upsert({
      where: { orderId: order.id },
      create: { orderId: order.id, total, sandbox, status: PaymentStatus.PENDING },
      update: { total, status: PaymentStatus.PENDING, sandbox },
    });

    if (accessToken) {
      const checkoutUrl = await this.createMercadoPagoCheckout(order, accessToken, sandbox);
      return {
        id: preference.id,
        orderId: preference.orderId,
        total: preference.total.toString(),
        status: 'pending',
        sandbox,
        provider: 'mercadopago',
        checkoutUrl,
      };
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

  async receiveMercadoPagoWebhook(
    dataId: string | undefined,
    xSignature: string | undefined,
    xRequestId: string | undefined,
    notificationType?: string,
  ) {
    if (notificationType && notificationType !== 'payment') {
      return { accepted: true, ignored: true };
    }
    const { accessToken, webhookSecret } = readMercadoPagoConfig();
    if (!accessToken || !webhookSecret) {
      throw new ServiceUnavailableException('Mercado Pago no está configurado');
    }
    if (
      !dataId ||
      !isValidMercadoPagoSignature({ dataId, xSignature, xRequestId, secret: webhookSecret })
    ) {
      throw new UnauthorizedException('Webhook de Mercado Pago inválido');
    }

    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!response.ok) {
      throw new ServiceUnavailableException('No se pudo verificar el pago en Mercado Pago');
    }
    const payment = (await response.json()) as MercadoPagoPayment;
    const orderId = payment.external_reference;
    const paymentId = payment.id?.toString();
    if (!orderId || !paymentId || !payment.status) {
      throw new BadRequestException('Notificación de pago incompleta');
    }
    const preference = await this.prisma.paymentPreference.findUnique({ where: { orderId } });
    if (!preference) throw new NotFoundException('Orden asociada al pago no encontrada');

    const status = mapMercadoPagoStatus(payment.status);
    if (!this.amountMatches(payment, preference.total)) {
      await this.recordAmountMismatch(paymentId, preference.id, orderId);
      this.logger.warn(
        `Pago ${paymentId} con monto o moneda distinta a la orden ${orderId}: no se aplicó el estado ${status}`,
      );
      return { accepted: true, ignored: 'amount_mismatch' };
    }

    const idempotencyKey = `mercadopago:${paymentId}:${status}`;
    let result: { duplicate: boolean; applied: boolean };
    try {
      result = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.paymentEvent.findUnique({ where: { idempotencyKey } });
        if (existing) return { duplicate: true, applied: false };

        const current = await tx.paymentPreference.findUnique({ where: { orderId } });
        if (!current) throw new NotFoundException('Orden asociada al pago no encontrada');
        const shouldApply = !(
          isTerminalPaymentStatus(current.status) && !isTerminalPaymentStatus(status)
        );

        await tx.paymentEvent.create({
          data: {
            idempotencyKey,
            eventType: 'mercadopago.payment',
            preferenceId: current.id,
            orderId,
            status,
          },
        });
        if (!shouldApply) return { duplicate: false, applied: false };

        await tx.paymentPreference.update({ where: { id: current.id }, data: { status } });
        const orderStatus = this.orderStatusFor(status);
        await tx.order.update({
          where: { id: orderId },
          data: { paymentStatus: status, ...(orderStatus ? { status: orderStatus } : {}) },
        });
        return { duplicate: false, applied: true };
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        return { accepted: true, duplicate: true, applied: false };
      }
      throw error;
    }

    if (result.applied && status === PaymentStatus.APPROVED) {
      void this.sendPaymentApprovedEmail(orderId).catch(() => undefined);
    }
    return { accepted: true, ...result };
  }

  async receiveLocalWebhook(
    idempotencyKey: string | undefined,
    webhookSecret: string | undefined,
    body: LocalPaymentWebhookDto,
  ) {
    if (process.env.NODE_ENV === 'production') {
      throw new ServiceUnavailableException(
        'Los webhooks locales de sandbox están deshabilitados en producción',
      );
    }
    const key = idempotencyKey?.trim();
    if (!key || key.length > 128) {
      throw new BadRequestException('Idempotency-Key requerido');
    }
    if (readMercadoPagoConfig().accessToken) {
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
        const orderStatus = this.orderStatusFor(status);
        await tx.order.update({
          where: { id: preference.orderId },
          data: { paymentStatus: status, ...(orderStatus ? { status: orderStatus } : {}) },
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

  private amountMatches(payment: MercadoPagoPayment, expectedTotal: Prisma.Decimal): boolean {
    if (typeof payment.transaction_amount !== 'number') return false;
    if ((payment.currency_id ?? '').toUpperCase() !== 'ARS') return false;
    return Math.abs(payment.transaction_amount - Number(expectedTotal.toString())) < 0.01;
  }

  private async recordAmountMismatch(paymentId: string, preferenceId: string, orderId: string) {
    try {
      await this.prisma.paymentEvent.create({
        data: {
          idempotencyKey: `mercadopago:${paymentId}:mismatch`,
          eventType: 'mercadopago.amount_mismatch',
          preferenceId,
          orderId,
          status: PaymentStatus.IN_PROCESS,
        },
      });
    } catch (error) {
      if (!this.isUniqueConstraintError(error)) throw error;
    }
  }

  private orderStatusFor(status: PaymentStatus): OrderStatus | undefined {
    if (status === PaymentStatus.APPROVED) return OrderStatus.CONFIRMED;
    if (status === PaymentStatus.REFUNDED || status === PaymentStatus.CHARGED_BACK) {
      return OrderStatus.REFUNDED;
    }
    return undefined;
  }

  private async createMercadoPagoCheckout(
    order: CheckoutOrder,
    accessToken: string,
    sandbox: boolean,
  ) {
    const { webAppUrl, apiPublicUrl } = readMercadoPagoConfig();
    if (!webAppUrl || !apiPublicUrl) {
      throw new ServiceUnavailableException(
        'WEB_APP_URL y API_PUBLIC_URL son requeridas para cobrar con Mercado Pago',
      );
    }
    const items = order.items.map((item) => ({
      id: item.product.sku,
      title: `${item.product.brand} ${item.product.name}`,
      quantity: item.quantity,
      currency_id: 'ARS',
      unit_price: Number(item.unitPrice.toString()),
    }));
    if (!order.shippingCost.isZero()) {
      items.push({
        id: `shipping-${order.id}`,
        title: 'Envío',
        quantity: 1,
        currency_id: 'ARS',
        unit_price: Number(order.shippingCost.toString()),
      });
    }
    const [firstName, ...restOfName] = order.user.name.trim().split(/\s+/);
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items,
        payer: {
          email: order.user.email,
          name: firstName || undefined,
          surname: restOfName.join(' ') || undefined,
        },
        external_reference: order.id,
        statement_descriptor: 'LUCIA PERFUMERIA',
        auto_return: 'approved',
        back_urls: {
          success: `${webAppUrl}/account/orders?payment=success`,
          failure: `${webAppUrl}/account/orders?payment=failure`,
          pending: `${webAppUrl}/account/orders?payment=pending`,
        },
        notification_url: `${apiPublicUrl}/payments/mercadopago/webhook`,
      }),
    });
    if (!response.ok) {
      throw new ServiceUnavailableException('No se pudo iniciar el checkout de Mercado Pago');
    }
    const preference = (await response.json()) as {
      init_point?: string;
      sandbox_init_point?: string;
    };
    const checkoutUrl = sandbox
      ? (preference.sandbox_init_point ?? preference.init_point)
      : preference.init_point;
    if (!checkoutUrl) {
      throw new ServiceUnavailableException('Mercado Pago no devolvió una URL de pago');
    }
    return checkoutUrl;
  }

  private async sendPaymentApprovedEmail(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { email: true, name: true } } },
    });
    if (!order) return;
    const formattedTotal = Number(order.total.toString()).toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    });
    const webAppUrl = process.env.WEB_APP_URL?.trim() || 'http://localhost:3000';
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
        <h1 style="text-transform:uppercase;letter-spacing:2px">Lucía</h1>
        <p>Hola ${order.user.name}, acreditamos el pago de tu pedido <strong>#${order.id.slice(0, 8).toUpperCase()}</strong> por <strong>${formattedTotal}</strong>.</p>
        <p>Ya estamos preparando el envío. Te avisamos cuando salga.</p>
        <p style="font-size:12px;color:#666">Gestioná tu pedido en <a href="${webAppUrl}/account/orders">Mis pedidos</a>.</p>
      </div>`;
    await this.mailService.send({
      to: order.user.email,
      subject: `Pago acreditado — pedido #${order.id.slice(0, 8).toUpperCase()}`,
      html,
    });
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
