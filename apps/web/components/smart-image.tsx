import Image from 'next/image';
import { isVercelBlobUrl } from '../lib/api';
import { ProductBottlePlaceholder } from './product-bottle-placeholder';

export function SmartImage({
  src,
  alt,
  className = 'object-cover',
  sizes = '100vw',
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (!isVercelBlobUrl(src)) {
    return <ProductBottlePlaceholder className={`absolute inset-0 ${className}`} />;
  }

  return <Image className={className} src={src} alt={alt} fill sizes={sizes} priority={priority} />;
}
