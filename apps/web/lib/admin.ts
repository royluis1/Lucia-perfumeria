import { getAccessToken } from './auth';
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
  const token = getAccessToken();
  if (!token) return;
  try {
    await fetch('/api/revalidate', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  } catch {
    return;
  }
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

function parseJsonBody(text: string) {
  try {
    return text ? (JSON.parse(text) as unknown) : null;
  } catch {
    return null;
  }
}

export function uploadProductImage(
  productId: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<AdminProductImage> {
  const token = getAccessToken();
  if (!token) return Promise.reject(new Error('Iniciá sesión con una cuenta administradora.'));

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', `${apiUrl}/admin/products/${productId}/images`);
    request.setRequestHeader('Authorization', `Bearer ${token}`);
    request.upload.onprogress = (event) => {
      if (onProgress && event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onload = () => {
      const body = parseJsonBody(request.responseText) as
        | { message?: string }
        | AdminProductImage
        | null;
      if (request.status >= 200 && request.status < 300) {
        resolve(body as AdminProductImage);
        return;
      }
      reject(new Error((body as { message?: string } | null)?.message ?? 'No se pudo subir la foto'));
    };
    request.onerror = () => reject(new Error('No se pudo subir la foto'));
    const form = new FormData();
    form.append('file', file);
    request.send(form);
  });
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