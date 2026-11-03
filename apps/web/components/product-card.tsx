import Link from 'next/link';
import { AddToCartButton } from './add-to-cart-button';
import { WishlistButton } from './wishlist-button';
import { SmartImage } from './smart-image';
import { resolveImageUrl } from '../lib/api';
import type { ProductSummary } from '../lib/api';
import { formatPrice } from '../lib/utils';
import { ProductBottlePlaceholder } from './product-bottle-placeholder';

export function ProductCard({ product }: { product: ProductSummary }) {
  const priceValue = Number(product.price);
  const galleryImages = (product.images ?? [])
    .map((image) => resolveImageUrl(image.url))
    .filter((url): url is string => Boolean(url));
  const primaryImage = galleryImages[0] ?? resolveImageUrl(product.imageUrl);
  const secondaryImage = galleryImages[1] ?? null;

  return (
    <article className="card relative min-w-0">
      <div className="relative aspect-[4/5] overflow-hidden bg-white">
        <Link className="group absolute inset-0 block" href={`/shop/${product.slug}`} aria-label={`Ver ${product.name}`}>
          {primaryImage ? (
            <>
              <SmartImage
                alt={product.name}
                className="img object-cover"
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 48vw"
                src={primaryImage}
              />
              {secondaryImage && (
                <span className="product-card-secondary absolute inset-0 opacity-0 transition-opacity duration-500">
                  <SmartImage
                    alt={`${product.name} · segunda vista`}
                    className="img object-cover"
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 48vw"
                    src={secondaryImage}
                  />
                </span>
              )}
            </>
          ) : <ProductBottlePlaceholder className="h-full w-full" />}
        </Link>
        <div className="heart absolute right-2 top-2 z-10 sm:right-4 sm:top-4">
          <WishlistButton product={product} />
        </div>
        <div className="add absolute inset-x-0 bottom-0 z-10">
          <AddToCartButton
            overlay
            productId={product.id}
            productName={product.name}
            productBrand={product.brand}
            productPrice={priceValue}
          />
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-1 pt-3 sm:flex-row sm:justify-between sm:gap-4 sm:pt-5">
        <div>
          <h2 className="text-xs font-semibold sm:text-sm">
            <Link className="ul" href={`/shop/${product.slug}`}>{product.name}</Link>
          </h2>
          {product.brandSlug ? (
            <p className="mt-1 truncate text-xs text-muted sm:text-sm">
              <Link className="ul" href={`/marcas/${product.brandSlug}`}>{product.brand}</Link>
            </p>
          ) : (
            <p className="mt-1 truncate text-xs text-muted sm:text-sm">{product.brand}</p>
          )}
        </div>
        <p className="text-xs font-semibold sm:shrink-0 sm:text-sm">{formatPrice(priceValue)}</p>
      </div>
    </article>
  );
}
