import { API_URL } from './config';

export type ProductImage = {
  id: string;
  url: string;
  alt: string | null;
  position: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  description: string;
  price: string;
  isActive: boolean;
  weightGrams: number;
  category: string;
  imageUrl: string | null;
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
};

export type ProductSort = 'recent' | 'price_asc' | 'price_desc' | 'name';

export type HomeHero = {
  product: Product | null;
  imageUrl: string | null;
  title: string | null;
  subtitle: string | null;
  buttonLabel: string | null;
};

export type HomeData = {
  hero: HomeHero;
  featured: Product[];
  categories: string[];
};

export type ProductList = {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const apiUrl = API_URL;

export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  return `${apiUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

export async function getProducts(searchParams?: URLSearchParams): Promise<ProductList> {
  const query = searchParams?.toString();
  const response = await fetch(`${apiUrl}/products${query ? `?${query}` : ''}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('No se pudo cargar el catálogo');
  }

  return response.json() as Promise<ProductList>;
}

export async function getProduct(slug: string): Promise<Product> {
  const response = await fetch(`${apiUrl}/products/${encodeURIComponent(slug)}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Producto no encontrado');
  }

  return response.json() as Promise<Product>;
}

export async function getHome(): Promise<HomeData> {
  const response = await fetch(`${apiUrl}/home`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 120, tags: ['home'] },
  });

  if (!response.ok) {
    throw new Error('No se pudo cargar la portada');
  }

  return response.json() as Promise<HomeData>;
}
