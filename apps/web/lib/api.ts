export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  description: string;
  price: string;
  isActive: boolean;
  weightGrams: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductList = {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

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
