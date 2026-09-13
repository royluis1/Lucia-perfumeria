import { getAccessToken } from './auth';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3005';

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  description: string;
  price: string;
  stock: number;
  sku: string;
  weightGrams: number;
  isActive: boolean;
  category: string;
  imageUrl: string | null;
};

export type AdminOrder = {
  id: string;
  status: string;
  paymentStatus: string;
  total: string;
  createdAt: string;
  user: { id: string; email: string; name: string | null };
  items: Array<{ quantity: number; product: { name: string; brand: string; sku: string } }>;
};

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  mfaEnabled: boolean;
  createdAt: string;
  _count: { orders: number };
};

async function adminFetch(path: string, init?: RequestInit) {
  const token = getAccessToken();
  if (!token) throw new Error('Iniciá sesión con una cuenta administradora.');
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body && typeof init.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? 'No tenés permisos para realizar esta acción.');
  }
  return response;
}

export async function listAdminProducts() {
  const response = await adminFetch('/admin/products');
  return response.json() as Promise<AdminProduct[]>;
}

export async function createAdminProduct(input: Record<string, unknown>) {
  await adminFetch('/admin/products', { method: 'POST', body: JSON.stringify(input) });
}

export async function updateAdminProduct(id: string, input: Record<string, unknown>) {
  await adminFetch(`/admin/products/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export async function deactivateAdminProduct(id: string) {
  await adminFetch(`/admin/products/${id}`, { method: 'DELETE' });
}

export async function uploadImage(file: File): Promise<string> {
  const token = getAccessToken();
  if (!token) throw new Error('Iniciá sesión con una cuenta administradora.');
  const form = new FormData();
  form.append('file', file);
  const response = await fetch(`${apiUrl}/admin/products/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? 'No se pudo subir la imagen');
  }
  const result = (await response.json()) as { url: string };
  return result.url;
}

export async function listAdminOrders(page = 1) {
  const response = await adminFetch(`/admin/orders?page=${page}&limit=20`);
  return response.json() as Promise<{ data: AdminOrder[]; total: number; page: number; totalPages: number }>;
}

export async function updateAdminOrder(id: string, input: { status?: string; paymentStatus?: string }) {
  await adminFetch(`/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export async function listAdminUsers() {
  const response = await adminFetch('/admin/users');
  return response.json() as Promise<AdminUser[]>;
}

export async function updateAdminUser(id: string, input: { role?: string; mfaEnabled?: boolean }) {
  await adminFetch(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export type PendingReview = {
  id: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  product: { id: string; name: string; slug: string };
  user: { id: string; name: string | null };
};

export async function listPendingReviews() {
  const response = await adminFetch('/admin/reviews/pending');
  return response.json() as Promise<PendingReview[]>;
}

export async function approveReview(id: string) {
  await adminFetch(`/admin/reviews/${id}/approve`, { method: 'PATCH' });
}

export async function deleteReview(id: string) {
  await adminFetch(`/admin/reviews/${id}`, { method: 'DELETE' });
}