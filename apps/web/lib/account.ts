import { apiFetch } from './auth';
import type { AuthResponse } from './auth';
import { API_URL } from './config';

const apiUrl = API_URL;

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
  if (response.status === 401) {
    return new Error('Tu sesión terminó. Ingresá de nuevo para continuar.');
  }
  const body = (await response.json().catch(() => null)) as { message?: string } | null;
  return new Error(body?.message ?? 'Ocurrió un error, intentá de nuevo.');
}

export async function getMyOrders(): Promise<Order[]> {
  const response = await apiFetch('/orders');
  if (!response.ok) throw await parseError(response);
  return response.json() as Promise<Order[]>;
}

export async function updateProfile(input: { name: string; phone?: string }) {
  const response = await apiFetch('/auth/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw await parseError(response);
  return response.json() as Promise<{ user: { name: string; phone: string | null } }>;
}

export async function changePassword(input: { currentPassword: string; newPassword: string }) {
  const response = await apiFetch('/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
    credentials: 'include',
  });
  if (!response.ok) throw await parseError(response);
  return { ok: true };
}

export async function resetPassword(token: string, password: string) {
  const response = await fetch(`${apiUrl}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
    credentials: 'include',
  });
  if (!response.ok) throw await parseError(response);
  return { ok: true };
}

export async function verifyMfa(mfaToken: string, code: string): Promise<AuthResponse> {
  let response: Response;
  try {
    response = await fetch(`${apiUrl}/auth/mfa/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ challengeToken: mfaToken, code }),
      credentials: 'include',
    });
  } catch {
    throw new Error('No pudimos conectar con el servidor. Intentá nuevamente.');
  }
  if (!response.ok) throw await parseError(response);
  return response.json() as Promise<AuthResponse>;
}

export async function setupMfa(): Promise<{ secret: string; otpauthUrl: string; qrDataUrl: string }> {
  const response = await apiFetch('/auth/mfa/setup');
  if (!response.ok) throw await parseError(response);
  return response.json() as Promise<{ secret: string; otpauthUrl: string; qrDataUrl: string }>;
}

export async function enableMfa(code: string) {
  const response = await apiFetch('/auth/mfa/enable', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!response.ok) throw await parseError(response);
  return { ok: true };
}

export async function disableMfa(code: string) {
  const response = await apiFetch('/auth/mfa/disable', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!response.ok) throw await parseError(response);
  return { ok: true };
}
