export interface ProductQueryDto {
  search?: string;
  category?: string;
  brand?: string;
  gender?: string;
  sort?: 'recent' | 'price_asc' | 'price_desc' | 'name';
  page?: string;
  limit?: string;
}
