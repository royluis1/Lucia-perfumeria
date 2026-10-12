export interface PublicProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  description: string;
  price: string;
  weightGrams: number;
  category: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedProducts {
  data: PublicProduct[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
