import Link from 'next/link';
import { AddToCartButton } from './add-to-cart-button';
import { WishlistButton } from './wishlist-button';
import { SmartImage } from './smart-image';
import { resolveImageUrl } from '../lib/api';
import type { ProductSummary } from '../lib/api';

export function ProductCard({ product }: { product: ProductSummary }) {
  const priceValue = Number(product.price);
  const galleryImages = (product.images ?? [])
    .map((image) => resolveImageUrl(image.url))
    .filter((url): url is string => Boolean(url));
  const primaryImage = galleryImages[0] ?? resolveImageUrl(product.imageUrl);
  const secondaryImage = galleryImages[1] ?? null;

  return (
    <article className="card relative">
      <div className="relative aspect-[4/5] overflow-hidden bg-white">
        <Link className="group absolute inset-0 block" href={`/shop/${product.slug}`} aria-label={`Ver ${product.name}`}>
          {primaryImage ? (
            <>
              <SmartImage
                alt={product.name}
                className="img object-cover"
                sizes="(min-width: 768px) 33vw, 90vw"
                src={primaryImage}
              />
              {secondaryImage && (
                <span className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <SmartImage
                    alt={`${product.name} · segunda vista`}
                    className="img object-cover"
                    sizes="(min-width: 768px) 33vw, 90vw"
                    src={secondaryImage}
                  />
                </span>
              )}
            </>
          ) : (
            <span className="flex h-full w-full items-end justify-center p-10">
              <span className="img block h-52 w-28 bg-gradient-to-b from-white to-black/10 shadow-xl transition" />
            </span>
          )}
        </Link>
        <div className="heart absolute right-4 top-4 z-10">
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
      <div className="flex justify-between gap-4 pt-5">
        <div>
          <h2 className="text-sm font-semibold">
            <Link className="ul" href={`/shop/${product.slug}`}>{product.name}</Link>
          </h2>
          {product.brandSlug ? (
            <p className="mt-1 text-sm text-muted">
              <Link className="ul" href={`/marcas/${product.brandSlug}`}>{product.brand}</Link>
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted">{product.brand}</p>
          )}
        </div>
        <p className="text-sm font-semibold">{priceValue.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })}</p>
      </div>
    </article>
  );
}
