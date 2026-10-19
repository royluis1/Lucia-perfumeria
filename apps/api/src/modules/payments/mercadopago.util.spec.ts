import { PaymentStatus } from '@prisma/client';
import { createHmac } from 'crypto';
import {
  buildSignatureManifest,
  isMercadoPagoConfigured,
  isSandboxToken,
  isTerminalPaymentStatus,
  isValidMercadoPagoSignature,
  mapMercadoPagoStatus,
  parseSignatureHeader,
  readMercadoPagoConfig,
} from './mercadopago.util';

function sign(dataId: string, requestId: string, ts: string, secret: string) {
  const manifest = buildSignatureManifest(dataId, requestId, ts);
  return createHmac('sha256', secret).update(manifest).digest('hex');
}

describe('mercadopago.util', () => {
  describe('firma de webhook', () => {
    const secret = 'clave-secreta-de-prueba';

    it('acepta una firma válida con el manifiesto documentado por Mercado Pago', () => {
      const valid = isValidMercadoPagoSignature({
        dataId: '123456789',
        xSignature: `ts=1704908010,v1=${sign('123456789', 'req-1', '1704908010', secret)}`,
        xRequestId: 'req-1',
        secret,
      });
      expect(valid).toBe(true);
    });

    it('normaliza el data.id a minúsculas igual que el manifiesto', () => {
      const signature = sign('abc123', 'req-2', '1704908010', secret);
      expect(
        isValidMercadoPagoSignature({
          dataId: 'ABC123',
          xSignature: `ts=1704908010,v1=${signature}`,
          xRequestId: 'req-2',
          secret,
        }),
      ).toBe(true);
    });

    it('rechaza firma inválida, header ausente o partes faltantes', () => {
      expect(
        isValidMercadoPagoSignature({
          dataId: '123',
          xSignature: undefined,
          xRequestId: 'req',
          secret,
        }),
      ).toBe(false);
      expect(
        isValidMercadoPagoSignature({
          dataId: '123',
          xSignature: 'ts=1704908010',
          xRequestId: 'req',
          secret,
        }),
      ).toBe(false);
      expect(
        isValidMercadoPagoSignature({
          dataId: '123',
          xSignature: `ts=1704908010,v1=${sign('999', 'req', '1704908010', secret)}`,
          xRequestId: 'req',
          secret,
        }),
      ).toBe(false);
      expect(
        isValidMercadoPagoSignature({
          dataId: '123',
          xSignature: `ts=1704908010,v1=${sign('123', 'otro-req', '1704908010', secret)}`,
          xRequestId: 'req',
          secret,
        }),
      ).toBe(false);
    });

    it('parsea el header de firma tolerando espacios', () => {
      expect(parseSignatureHeader('ts=123, v1=abc')).toEqual({ ts: '123', v1: 'abc' });
      expect(parseSignatureHeader(undefined)).toEqual({});
    });
  });

  describe('mapeo de estados', () => {
    it('mapea los estados de Mercado Pago a PaymentStatus', () => {
      expect(mapMercadoPagoStatus('approved')).toBe(PaymentStatus.APPROVED);
      expect(mapMercadoPagoStatus('rejected')).toBe(PaymentStatus.REJECTED);
      expect(mapMercadoPagoStatus('cancelled')).toBe(PaymentStatus.REJECTED);
      expect(mapMercadoPagoStatus('refunded')).toBe(PaymentStatus.REFUNDED);
      expect(mapMercadoPagoStatus('charged_back')).toBe(PaymentStatus.CHARGED_BACK);
      expect(mapMercadoPagoStatus('pending')).toBe(PaymentStatus.IN_PROCESS);
      expect(mapMercadoPagoStatus('in_process')).toBe(PaymentStatus.IN_PROCESS);
      expect(mapMercadoPagoStatus('desconocido')).toBe(PaymentStatus.IN_PROCESS);
    });

    it('considera terminales sólo a los estados definitivos', () => {
      expect(isTerminalPaymentStatus(PaymentStatus.APPROVED)).toBe(true);
      expect(isTerminalPaymentStatus(PaymentStatus.REFUNDED)).toBe(true);
      expect(isTerminalPaymentStatus(PaymentStatus.CHARGED_BACK)).toBe(true);
      expect(isTerminalPaymentStatus(PaymentStatus.PENDING)).toBe(false);
      expect(isTerminalPaymentStatus(PaymentStatus.IN_PROCESS)).toBe(false);
      expect(isTerminalPaymentStatus(PaymentStatus.REJECTED)).toBe(false);
    });
  });

  describe('configuración por entorno', () => {
    const env = {
      MERCADOPAGO_ACCESS_TOKEN: 'TEST-123',
      MERCADOPAGO_WEBHOOK_SECRET: 'secreto',
      WEB_APP_URL: 'https://lucia-perfumeria.vercel.app',
      API_PUBLIC_URL: 'https://lucia-perfumeria-609t.onrender.com',
    } as NodeJS.ProcessEnv;

    it('detecta configurado sólo con las cuatro variables completas', () => {
      expect(isMercadoPagoConfigured(env)).toBe(true);
      expect(isMercadoPagoConfigured({ ...env, API_PUBLIC_URL: '  ' })).toBe(false);
      expect(isMercadoPagoConfigured({ ...env, MERCADOPAGO_WEBHOOK_SECRET: undefined })).toBe(false);
      expect(isMercadoPagoConfigured({})).toBe(false);
    });

    it('distingue tokens de prueba de producción', () => {
      expect(isSandboxToken('TEST-123')).toBe(true);
      expect(isSandboxToken('APP_USR-123')).toBe(false);
    });

    it('recorta espacios de las variables', () => {
      const config = readMercadoPagoConfig({ ...env, MERCADOPAGO_ACCESS_TOKEN: ' TEST-123 ' });
      expect(config.accessToken).toBe('TEST-123');
    });
  });
});
