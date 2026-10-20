jest.mock('@nestjs/common', () => jest.requireActual('../../../__mocks__/nestjs-common'));

import {
  ConflictException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
import { createHmac } from 'crypto';
import { PaymentsService } from './payments.service';

const WEBHOOK_SECRET = 'secreto-webhook-de-prueba';
const ACCESS_TOKEN = 'TEST-token-de-prueba';
const ORDER_ID = 'a1b2c3d4-0000-0000-0000-000000000001';

function buildXSignature(dataId: string, requestId: string, ts = '1704908010'): string {
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const v1 = createHmac('sha256', WEBHOOK_SECRET).update(manifest).digest('hex');
  return `ts=${ts},v1=${v1}`;
}

function configuredEnv() {
  process.env.MERCADOPAGO_ACCESS_TOKEN = ACCESS_TOKEN;
  process.env.MERCADOPAGO_WEBHOOK_SECRET = WEBHOOK_SECRET;
  process.env.WEB_APP_URL = 'https://lucia-perfumeria.vercel.app';
  process.env.API_PUBLIC_URL = 'https://lucia-perfumeria-609t.onrender.com';
}

describe('PaymentsService', () => {
  const originalEnv = { ...process.env };
  const tx = {
    paymentPreference: { findUnique: jest.fn(), update: jest.fn() },
    paymentEvent: { findUnique: jest.fn(), create: jest.fn() },
    order: { update: jest.fn() },
  };
  const prisma = {
    paymentPreference: { findUnique: jest.fn(), upsert: jest.fn() },
    paymentEvent: { findUnique: jest.fn(), create: jest.fn() },
    order: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(),
  };
  const mailService = { send: jest.fn().mockResolvedValue(undefined) };
  const fetchMock = jest.fn();
  let service: PaymentsService;

  const preference = {
    id: 'pref-1',
    orderId: ORDER_ID,
    total: { toString: () => '105.50' },
    status: PaymentStatus.PENDING,
    sandbox: true,
  };

  function mockPayment(overrides: Record<string, unknown> = {}) {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 999,
        status: 'approved',
        external_reference: ORDER_ID,
        transaction_amount: 105.5,
        currency_id: 'ARS',
        ...overrides,
      }),
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    for (const key of [
      'MERCADOPAGO_ACCESS_TOKEN',
      'MERCADOPAGO_WEBHOOK_SECRET',
      'WEB_APP_URL',
      'API_PUBLIC_URL',
      'PAYMENTS_WEBHOOK_SECRET',
      'NODE_ENV',
    ]) {
      delete process.env[key];
    }
    prisma.$transaction.mockImplementation((fn: (client: typeof tx) => unknown) => fn(tx));
    (global as any).fetch = fetchMock;
    service = new PaymentsService(prisma as any, mailService as any);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getCheckoutStatus', () => {
    it('reporta no configurado sin credenciales', () => {
      expect(service.getCheckoutStatus()).toEqual({ configured: false, provider: null });
    });

    it('reporta configurado con todas las variables', () => {
      configuredEnv();
      expect(service.getCheckoutStatus()).toEqual({ configured: true, provider: 'mercadopago' });
    });
  });

  describe('createPreference', () => {
    function buildOrder(overrides: Record<string, unknown> = {}) {
      return {
        id: ORDER_ID,
        subtotal: new Prisma.Decimal('95.00'),
        shippingCost: new Prisma.Decimal('7500.95'),
        total: new Prisma.Decimal('7595.95'),
        paymentStatus: PaymentStatus.PENDING,
        user: { email: 'cliente@example.com', name: 'Cliente Test' },
        items: [
          {
            quantity: 1,
            unitPrice: new Prisma.Decimal('95.00'),
            subtotal: new Prisma.Decimal('95.00'),
            product: { name: 'Black Opium', brand: 'Yves Saint Laurent', sku: 'BO-1' },
          },
        ],
        ...overrides,
      };
    }

    it('permite reintentar una orden rechazada creando una preferencia nueva', async () => {
      configuredEnv();
      prisma.order.findFirst.mockResolvedValue(buildOrder({ paymentStatus: PaymentStatus.REJECTED }));
      prisma.paymentPreference.upsert.mockResolvedValue(preference);
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'mp-pref-1',
          init_point: 'https://mp/init',
          sandbox_init_point: 'https://mp/sandbox',
        }),
      });

      const result = await service.createPreference('user-1', ORDER_ID);

      expect(result.checkoutUrl).toBe('https://mp/sandbox');
      expect(prisma.paymentPreference.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { orderId: ORDER_ID } }),
      );
    });

    it('bloquea un pago nuevo si la orden ya está acreditada', async () => {
      configuredEnv();
      prisma.order.findFirst.mockResolvedValue(buildOrder({ paymentStatus: PaymentStatus.APPROVED }));

      await expect(service.createPreference('user-1', ORDER_ID)).rejects.toThrow(ConflictException);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('registra status y cuerpo del error de Mercado Pago sin exponer el token', async () => {
      configuredEnv();
      prisma.order.findFirst.mockResolvedValue(buildOrder());
      prisma.paymentPreference.upsert.mockResolvedValue(preference);
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () =>
          '{"message":"invalid access token","cause":"APP_USR-1234567890-secreto"}',
      });
      const loggerSpy = jest.spyOn((service as unknown as { logger: { error: () => void } }).logger, 'error');

      await expect(service.createPreference('user-1', ORDER_ID)).rejects.toThrow(
        ServiceUnavailableException,
      );

      expect(loggerSpy).toHaveBeenCalledTimes(1);
      const logged = String(loggerSpy.mock.calls[0][0]);
      expect(logged).toContain('status 401');
      expect(logged).toContain('invalid access token');
      expect(logged).not.toContain('APP_USR-1234567890-secreto');
    });
  });

  describe('receiveMercadoPagoWebhook', () => {
    it('rechaza si Mercado Pago no está configurado', async () => {
      await expect(
        service.receiveMercadoPagoWebhook('999', buildXSignature('999', 'req'), 'req'),
      ).rejects.toThrow(ServiceUnavailableException);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('ignora notificaciones que no son de pago', async () => {
      configuredEnv();
      await expect(
        service.receiveMercadoPagoWebhook('999', undefined, undefined, 'merchant_order'),
      ).resolves.toEqual({ accepted: true, ignored: true });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rechaza firmas inválidas sin consultar Mercado Pago', async () => {
      configuredEnv();
      await expect(
        service.receiveMercadoPagoWebhook('999', 'ts=1704908010,v1=deadbeef', 'req'),
      ).rejects.toThrow(UnauthorizedException);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('no aplica el pago si el monto o la moneda no coinciden con la orden', async () => {
      configuredEnv();
      prisma.paymentPreference.findUnique.mockResolvedValue(preference);
      prisma.paymentEvent.create.mockResolvedValue({});
      mockPayment({ transaction_amount: 1 });

      await expect(
        service.receiveMercadoPagoWebhook('999', buildXSignature('999', 'req'), 'req'),
      ).resolves.toEqual({ accepted: true, ignored: 'amount_mismatch' });

      expect(prisma.paymentEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ eventType: 'mercadopago.amount_mismatch' }),
        }),
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('aplica un pago aprobado y confirma la orden', async () => {
      configuredEnv();
      prisma.paymentPreference.findUnique.mockResolvedValue(preference);
      tx.paymentEvent.findUnique.mockResolvedValue(null);
      tx.paymentPreference.findUnique.mockResolvedValue(preference);
      tx.paymentEvent.create.mockResolvedValue({});
      tx.paymentPreference.update.mockResolvedValue({});
      tx.order.update.mockResolvedValue({});
      prisma.order.findUnique.mockResolvedValue(null);
      mockPayment();

      await expect(
        service.receiveMercadoPagoWebhook('999', buildXSignature('999', 'req'), 'req'),
      ).resolves.toEqual({ accepted: true, duplicate: false, applied: true });

      expect(tx.order.update).toHaveBeenCalledWith({
        where: { id: ORDER_ID },
        data: { paymentStatus: PaymentStatus.APPROVED, status: 'CONFIRMED' },
      });
      expect(mailService.send).not.toHaveBeenCalled();
    });

    it('envía el email de pago acreditado cuando la orden existe', async () => {
      configuredEnv();
      prisma.paymentPreference.findUnique.mockResolvedValue(preference);
      tx.paymentEvent.findUnique.mockResolvedValue(null);
      tx.paymentPreference.findUnique.mockResolvedValue(preference);
      tx.paymentEvent.create.mockResolvedValue({});
      tx.paymentPreference.update.mockResolvedValue({});
      tx.order.update.mockResolvedValue({});
      prisma.order.findUnique.mockResolvedValue({
        id: ORDER_ID,
        total: { toString: () => '105.50' },
        user: { email: 'cliente@example.com', name: 'Cliente' },
      });
      mockPayment();

      await service.receiveMercadoPagoWebhook('999', buildXSignature('999', 'req'), 'req');
      await new Promise((resolve) => setImmediate(resolve));

      expect(mailService.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'cliente@example.com' }),
      );
    });

    it('es idempotente ante eventos repetidos', async () => {
      configuredEnv();
      prisma.paymentPreference.findUnique.mockResolvedValue(preference);
      tx.paymentEvent.findUnique.mockResolvedValue({ id: 'evt-1' });
      mockPayment();

      await expect(
        service.receiveMercadoPagoWebhook('999', buildXSignature('999', 'req'), 'req'),
      ).resolves.toEqual({ accepted: true, duplicate: true, applied: false });

      expect(tx.paymentPreference.update).not.toHaveBeenCalled();
      expect(tx.order.update).not.toHaveBeenCalled();
    });

    it('no degrada el estado de una orden ya acreditada con notificaciones no terminales', async () => {
      configuredEnv();
      prisma.paymentPreference.findUnique.mockResolvedValue(preference);
      tx.paymentEvent.findUnique.mockResolvedValue(null);
      tx.paymentPreference.findUnique.mockResolvedValue({
        ...preference,
        status: PaymentStatus.APPROVED,
      });
      tx.paymentEvent.create.mockResolvedValue({});
      mockPayment({ status: 'in_process' });

      await expect(
        service.receiveMercadoPagoWebhook('999', buildXSignature('999', 'req'), 'req'),
      ).resolves.toEqual({ accepted: true, duplicate: false, applied: false });

      expect(tx.paymentEvent.create).toHaveBeenCalled();
      expect(tx.order.update).not.toHaveBeenCalled();
    });
  });

  describe('receiveLocalWebhook', () => {
    const body = {
      event: 'local.test.payment',
      preferenceId: 'pref-1',
      status: PaymentStatus.APPROVED,
      sandbox: true,
    } as any;

    it('está deshabilitado en producción', async () => {
      process.env.NODE_ENV = 'production';
      await expect(service.receiveLocalWebhook('key-1', 'x', body)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('aplica el evento local y confirma la orden', async () => {
      process.env.PAYMENTS_WEBHOOK_SECRET = 'secreto-local';
      tx.paymentEvent.findUnique.mockResolvedValue(null);
      tx.paymentPreference.findUnique.mockResolvedValue(preference);
      tx.paymentEvent.create.mockResolvedValue({ id: 'evt-local' });
      tx.paymentPreference.update.mockResolvedValue({});
      tx.order.update.mockResolvedValue({});

      await expect(service.receiveLocalWebhook('key-1', 'secreto-local', body)).resolves.toEqual({
        accepted: true,
        duplicate: false,
        eventId: 'evt-local',
        status: PaymentStatus.APPROVED,
      });
      expect(tx.order.update).toHaveBeenCalledWith({
        where: { id: ORDER_ID },
        data: { paymentStatus: PaymentStatus.APPROVED, status: 'CONFIRMED' },
      });
    });
  });
});
