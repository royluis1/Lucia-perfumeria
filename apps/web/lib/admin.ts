import {
  apiFetch,
  expireSession,
  getAccessToken,
  recoverSessionAfterUnauthorized,
} from './auth';
import { API_URL } from './config';

const apiUrl = API_URL;

export type AdminProductImage = {
  id: string;
  url: string;
  alt: string | null;
  position: number;
};

export type AdminProductGender = 'FEMENINO' | 'MASCULINO' | 'UNISEX';

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
  gender: AdminProductGender | null;
  brandRef: { id: string; name: string; slug: string } | null;
  categories: Array<{ category: { id: string; name: string; slug: string } }>;
  imageUrl: string | null;
  images: AdminProductImage[];
  featured: boolean;
  featuredOrder: number;
};

export type AdminBrand = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
};

export type AdminHero = {
  productId: string | null;
  imageUrl: string | null;
  title: string | null;
  subtitle: string | null;
  buttonLabel: string | null;
  businessHours: string | null;
  storePhotoUrl: string | null;
  product: {
    id: string;
    slug: string;
    name: string;
    brand: string;
    imageUrl: string | null;
    isActive: boolean;
    stock: number;
  } | null;
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

export type AdminEarningsReport = {
  period: string;
  range: { from: string; to: string };
  summary: {
    completedSales: number;
    collectedTotal: number;
    unitsSold: number;
    averageTicket: number;
    pendingOrders: number;
    refundedOrders: number;
    refundedAmount: number | null;
    returnedUnits: number | null;
    netProfit: number | null;
    currency: 'ARS';
    previous: { completedSales: number; collectedTotal: number; unitsSold: number };
    comparison: { completedSales: number | null; collectedTotal: number | null };
    limitations: {
      costsRecorded: boolean;
      operationalExpensesRecorded: boolean;
      partialRefundsRecorded: boolean;
      productReturnsRecorded: boolean;
      discountsRecorded: boolean;
      message: string;
    };
  };
  paymentMethods: Array<{ method: string; sales: number; amount: number }>;
  trend: Array<{ date: string; sales: number; revenue: number }>;
  products: {
    byUnits: Array<{ id: string; name: string; imageUrl: string | null; unitsSold: number; revenue: number }>;
    byRevenue: Array<{ id: string; name: string; imageUrl: string | null; unitsSold: number; revenue: number }>;
  };
  orders: {
    data: Array<{
      id: string;
      createdAt: string;
      customer: string;
      itemCount: number;
      items: string;
      subtotal: string;
      shippingCost: string;
      total: string;
      status: string;
      paymentStatus: string;
      paymentMethod: string;
    }>;
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  returns: { available: boolean; message: string };
};

async function adminFetch(path: string, init?: RequestInit) {
  const response = await apiFetch(path, {
    ...init,
    headers: {
      ...(init?.body && typeof init.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Tu sesión terminó. Ingresá nuevamente para continuar.');
    }
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

export async function listAdminBrands() {
  const response = await adminFetch('/admin/brands');
  return response.json() as Promise<AdminBrand[]>;
}

export async function createAdminBrand(name: string) {
  const response = await adminFetch('/admin/brands', { method: 'POST', body: JSON.stringify({ name }) });
  return response.json() as Promise<AdminBrand>;
}

export async function updateAdminBrand(id: string, name: string) {
  const response = await adminFetch(`/admin/brands/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) });
  return response.json() as Promise<AdminBrand>;
}

export async function mergeAdminBrand(id: string, targetId: string) {
  const response = await adminFetch(`/admin/brands/${id}/merge`, {
    method: 'POST',
    body: JSON.stringify({ targetId }),
  });
  return response.json() as Promise<{ merged: string; into: string; productsMoved: number }>;
}

export async function listAdminCategories() {
  const response = await adminFetch('/admin/categories');
  return response.json() as Promise<AdminCategory[]>;
}

export async function getAdminHero() {
  const response = await adminFetch('/admin/home/hero');
  return response.json() as Promise<AdminHero>;
}

export async function updateAdminHero(input: Record<string, unknown>) {
  const response = await adminFetch('/admin/home/hero', { method: 'PUT', body: JSON.stringify(input) });
  return response.json() as Promise<AdminHero>;
}

export async function reorderFeaturedProducts(ids: string[]) {
  await adminFetch('/admin/products/featured-order', { method: 'PUT', body: JSON.stringify({ ids }) });
}

export async function revalidateHome() {
  try {
    const profile = await apiFetch('/auth/me');
    const token = getAccessToken();
    if (!profile.ok || !token) return;
    await fetch('/api/revalidate', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  } catch {
    return;
  }
}

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const response = await apiFetch('/admin/products/upload', {
    method: 'POST',
    body: form,
  });
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Tu sesión terminó. Ingresá nuevamente para continuar.');
    }
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? 'No se pudo subir la imagen');
  }
  const result = (await response.json()) as { url: string };
  return result.url;
}

export async function importAdminProductImageUrl(url: string): Promise<string> {
  const response = await adminFetch('/admin/products/import-url', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
  const result = (await response.json()) as { url: string };
  return result.url;
}

export async function addAdminProductImageFromUrl(productId: string, url: string) {
  const response = await adminFetch(`/admin/products/${productId}/images/import-url`, {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
  return response.json() as Promise<AdminProductImage>;
}

export async function uploadStorePhoto(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const response = await apiFetch('/admin/home/store-photo/upload', {
    method: 'POST',
    body: form,
  });
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Tu sesión terminó. Ingresá nuevamente para continuar.');
    }
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? 'No se pudo subir la foto del local');
  }
  const result = (await response.json()) as { url: string };
  return result.url;
}

function parseJsonBody(text: string) {
  try {
    return text ? (JSON.parse(text) as unknown) : null;
  } catch {
    return null;
  }
}

export async function uploadProductImage(
  productId: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<AdminProductImage> {
  let token = getAccessToken();
  if (!token) {
    const response = await apiFetch('/auth/me');
    token = getAccessToken();
    if (!response.ok || !token) throw new Error('Iniciá sesión con una cuenta administradora.');
  }

  const path = `/admin/products/${productId}/images`;
  const send = (accessToken: string) => new Promise<XMLHttpRequest>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', `${apiUrl}${path}`);
    request.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    request.withCredentials = true;
    request.upload.onprogress = (event) => {
      if (onProgress && event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onload = () => resolve(request);
    request.onerror = () => reject(new Error('No se pudo subir la foto'));
    const form = new FormData();
    form.append('file', file);
    request.send(form);
  });

  return (async () => {
    let request = await send(token);
    if (request.status === 401) {
      const refreshedToken = await recoverSessionAfterUnauthorized(true, token);
      if (!refreshedToken) throw new Error('Tu sesión terminó. Ingresá nuevamente para continuar.');
      request = await send(refreshedToken);
    }
    if (request.status === 401) {
      expireSession();
      throw new Error('Tu sesión terminó. Ingresá nuevamente para continuar.');
    }

    const body = parseJsonBody(request.responseText) as
      | { message?: string }
      | AdminProductImage
      | null;
    if (request.status < 200 || request.status >= 300) {
      throw new Error('No se pudo subir la foto. Intentá nuevamente.');
    }
    return body as AdminProductImage;
  })();
}

export async function deleteProductImage(productId: string, imageId: string) {
  const response = await adminFetch(`/admin/products/${productId}/images/${imageId}`, {
    method: 'DELETE',
  });
  return response.json() as Promise<{ id: string; deleted: boolean; images: AdminProductImage[] }>;
}

export async function reorderProductImages(productId: string, imageIds: string[]) {
  const response = await adminFetch(`/admin/products/${productId}/images/order`, {
    method: 'PUT',
    body: JSON.stringify({ imageIds }),
  });
  return response.json() as Promise<AdminProductImage[]>;
}

export async function listAdminOrders(page = 1) {
  const response = await adminFetch(`/admin/orders?page=${page}&limit=20`);
  return response.json() as Promise<{ data: AdminOrder[]; total: number; page: number; totalPages: number }>;
}

export async function getAdminEarnings(input: {
  period: string;
  from?: string;
  to?: string;
  page?: number;
  status?: string;
  search?: string;
}) {
  const params = new URLSearchParams({ period: input.period });
  if (input.from) params.set('from', input.from);
  if (input.to) params.set('to', input.to);
  if (input.page) params.set('page', String(input.page));
  if (input.status) params.set('status', input.status);
  if (input.search) params.set('search', input.search);
  const response = await adminFetch(`/admin/earnings?${params.toString()}`);
  return response.json() as Promise<AdminEarningsReport>;
}

export async function downloadAdminEarningsCsv(input: { period: string; from?: string; to?: string }) {
  const params = new URLSearchParams({ period: input.period });
  if (input.from) params.set('from', input.from);
  if (input.to) params.set('to', input.to);
  const response = await adminFetch(`/admin/earnings/export?${params.toString()}`);
  return response.blob();
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