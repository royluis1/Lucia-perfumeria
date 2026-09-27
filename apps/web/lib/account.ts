import { getAccessToken } from './auth';
import type { AuthResponse } from './auth';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3005';

export type Order = {
  id: string;
  status: string;
  paymentStatus: string;
  subtotal: string;
  shippingCost: string;
  total: string;
  createdAt: string;
  items: Array<{
    quantity: number;
    unitPrice: string;
    subtotal: string;
    product: { name: string; brand: string; slug: string };
  }>;
};

async function parseError(response: Response): Promise<Error> {
  const body = (await response.json().catch(() => null)) as { message?: string } | null;
  return new Error(body?.message ?? 'Ocurrió un error, intentá de nuevo.');
}

export async function getMyOrders(): Promise<Order[]> {
  const token = getAccessToken();
  if (!token) throw new Error('Iniciá sesión para consultar tus pedidos.');
  const response = await fetch(`${apiUrl}/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw await parseError(response);
  return response.json() as Promise<Order[]>;
}

export async function updateProfile(input: { name: string; phone?: string }) {
  const token = getAccessToken();
  const response = await fetch(`${apiUrl}/auth/profile`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw await parseError(response);
  return response.json() as Promise<{ user: { name: string; phone: string | null } }>;
}

export async function changePassword(input: { currentPassword: string; newPassword: string }) {
  const token = getAccessToken();
  const response = await fetch(`${apiUrl}/auth/change-password`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw await parseError(response);
  return { ok: true };
}

export async function requestPasswordReset(email: string) {
  const response = await fetch(`${apiUrl}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) throw await parseError(response);
  return { ok: true };
}

export async function resetPassword(token: string, password: string) {
  const response = await fetch(`${apiUrl}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });
  if (!response.ok) throw await parseError(response);
  return { ok: true };
}

export async function verifyMfa(mfaToken: string, code: string): Promise<AuthResponse> {
  const response = await fetch(`${apiUrl}/auth/mfa/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ challengeToken: mfaToken, code }),
  });
  if (!response.ok) throw await parseError(response);
  return response.json() as Promise<AuthResponse>;
}

export async function setupMfa(): Promise<{ secret: string; otpauthUrl: string; qrDataUrl: string }> {
  const token = getAccessToken();
  const response = await fetch(`${apiUrl}/auth/mfa/setup`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw await parseError(response);
  return response.json() as Promise<{ secret: string; otpauthUrl: string; qrDataUrl: string }>;
}

export async function enableMfa(code: string) {
  const token = getAccessToken();
  const response = await fetch(`${apiUrl}/auth/mfa/enable`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!response.ok) throw await parseError(response);
  return { ok: true };
}

export async function disableMfa(code: string) {
  const token = getAccessToken();
  const response = await fetch(`${apiUrl}/auth/mfa/disable`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!response.ok) throw await parseError(response);
  return { ok: true };
}