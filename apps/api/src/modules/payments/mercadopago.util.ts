import { PaymentStatus } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'crypto';

export type MercadoPagoConfig = {
  accessToken?: string;
  webhookSecret?: string;
  webAppUrl?: string;
  apiPublicUrl?: string;
};

export function readMercadoPagoConfig(env: NodeJS.ProcessEnv = process.env): MercadoPagoConfig {
  return {
    accessToken: env.MERCADOPAGO_ACCESS_TOKEN?.trim() || undefined,
    webhookSecret: env.MERCADOPAGO_WEBHOOK_SECRET?.trim() || undefined,
    webAppUrl: env.WEB_APP_URL?.trim() || undefined,
    apiPublicUrl: env.API_PUBLIC_URL?.trim() || undefined,
  };
}

export function isMercadoPagoConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  const config = readMercadoPagoConfig(env);
  return Boolean(config.accessToken && config.webhookSecret && config.webAppUrl && config.apiPublicUrl);
}

export function isSandboxToken(accessToken: string): boolean {
  return accessToken.startsWith('TEST-');
}

export function buildSignatureManifest(
  dataId: string,
  requestId: string | undefined,
  timestamp: string,
): string {
  return `id:${dataId.toLowerCase()};request-id:${requestId ?? ''};ts:${timestamp};`;
}

export function parseSignatureHeader(header: string | undefined): { ts?: string; v1?: string } {
  if (!header) return {};
  const values: Record<string, string> = {};
  for (const part of header.split(',')) {
    const [key, value] = part.trim().split('=', 2);
    if (key && value !== undefined) values[key] = value;
  }
  return { ts: values.ts, v1: values.v1 };
}

export function isValidMercadoPagoSignature(input: {
  dataId: string;
  xSignature: string | undefined;
  xRequestId: string | undefined;
  secret: string;
}): boolean {
  const { ts, v1 } = parseSignatureHeader(input.xSignature);
  if (!ts || !v1) return false;
  const manifest = buildSignatureManifest(input.dataId, input.xRequestId, ts);
  const calculated = createHmac('sha256', input.secret).update(manifest).digest('hex');
  const expected = Buffer.from(calculated);
  const received = Buffer.from(v1);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function mapMercadoPagoStatus(status: string): PaymentStatus {
  if (status === 'approved') return PaymentStatus.APPROVED;
  if (status === 'rejected' || status === 'cancelled') return PaymentStatus.REJECTED;
  if (status === 'refunded') return PaymentStatus.REFUNDED;
  if (status === 'charged_back') return PaymentStatus.CHARGED_BACK;
  return PaymentStatus.IN_PROCESS;
}

const TERMINAL_PAYMENT_STATUSES = new Set<PaymentStatus>([
  PaymentStatus.APPROVED,
  PaymentStatus.REFUNDED,
  PaymentStatus.CHARGED_BACK,
]);

export function isTerminalPaymentStatus(status: PaymentStatus): boolean {
  return TERMINAL_PAYMENT_STATUSES.has(status);
}
