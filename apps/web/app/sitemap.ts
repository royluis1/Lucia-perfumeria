import type { MetadataRoute } from 'next';
import { getProducts } from '../lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_WEB_APP_URL ?? 'https://lucia-perfumeria.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/shop`, changeFrequency: 'daily', priority: 0.9 },
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

  return [...staticEntries, ...products];
}