import { API_URL } from './config';

export type ProductImage = {
  id: string;
  url: string;
  alt: string | null;
  position: number;
};

export type ProductGender = 'FEMENINO' | 'MASCULINO' | 'UNISEX';

export type ProductCategory = {
  name: string;
  slug: string;
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
  gender: ProductGender | null;
  brandSlug: string | null;
  categories: ProductCategory[];
  imageUrl: string | null;
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
};

export type ProductSort = 'recent' | 'price_asc' | 'price_desc' | 'name';

export type ProductSummary = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: string;
  gender: ProductGender | null;
  brandSlug: string | null;
  imageUrl: string | null;
  images?: ProductImage[];
};

export type CategorySummary = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
};

export type BrandSummary = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
};

export type BrandDetail = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  data: ProductSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

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
  data: ProductSummary[];
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

export async function getCategories(): Promise<CategorySummary[]> {
  const response = await fetch(`${apiUrl}/categories`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    return [];
  }

  return response.json() as Promise<CategorySummary[]>;
}

export async function getBrands(): Promise<BrandSummary[]> {
  const response = await fetch(`${apiUrl}/brands`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('No se pudieron cargar las marcas');
  }

  return response.json() as Promise<BrandSummary[]>;
}

export async function getBrand(slug: string, searchParams?: URLSearchParams): Promise<BrandDetail> {
  const query = searchParams?.toString();
  const response = await fetch(`${apiUrl}/brands/${encodeURIComponent(slug)}${query ? `?${query}` : ''}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Marca no encontrada');
  }

  return response.json() as Promise<BrandDetail>;
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
