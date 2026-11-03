import type { MetadataRoute } from 'next';
import { getBrands, getProducts } from '../lib/api';
import { SITE_URL } from '../lib/config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/shop`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/marcas`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/nosotros`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/contacto`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/arrepentimiento`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/faq`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/terminos`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/envios`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/privacidad`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  let products: MetadataRoute.Sitemap = [];
  try {
    const result = await getProducts(new URLSearchParams({ limit: '100', sort: 'recent' }));
    products = result.data.map((product) => ({
      url: `${SITE_URL}/shop/${product.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch {
    products = [];
  }

  let brands: MetadataRoute.Sitemap = [];
  try {
    const result = await getBrands();
    brands = result.map((brand) => ({
      url: `${SITE_URL}/marcas/${brand.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch {
    brands = [];
  }

  return [...staticEntries, ...brands, ...products];
}