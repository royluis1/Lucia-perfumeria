import type { Metadata } from 'next';
import { siteConfig } from './brand';
import { SITE_URL } from './config';

const DEFAULT_IMAGE = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: siteConfig.name,
};

export function createPageMetadata({
  title,
  description,
  path,
  images,
}: {
  title: string;
  description: string;
  path: string;
  images?: string[];
}): Metadata {
  const pageTitle = title === siteConfig.name ? title : `${title} · ${siteConfig.name}`;
  const imageUrls = images?.length ? images : [DEFAULT_IMAGE.url];
  const imageMetadata = images?.length
    ? imageUrls
    : [DEFAULT_IMAGE];
  const url = new URL(path, SITE_URL).toString();

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: pageTitle,
      description,
      type: 'website',
      url,
      images: imageMetadata,
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      images: imageUrls,
    },
  };
}
