import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '../../../components/header';
import { AddToCartButton } from '../../../components/add-to-cart-button';
import { ProductGallery } from '../../../components/product-gallery';
import { ProductCard } from '../../../components/product-card';
import { ProductReviewsSection } from '../../../components/product-reviews';
import { WishlistButton } from '../../../components/wishlist-button';
import type { GalleryImage } from '../../../components/product-gallery';
import { getProduct, getProductReviews, getProducts, resolveImageUrl } from '../../../lib/api';
import type { Product, ProductSummary } from '../../../lib/api';
import type { Metadata } from 'next';
import { SITE_URL } from '../../../lib/config';
import { createPageMetadata } from '../../../lib/metadata';
import { formatPrice, serializeJsonLd } from '../../../lib/utils';

export const dynamic = 'force-dynamic';

type ProductPageProps = { params: Promise<{ slug: string }> };

function buildGallery(product: Product): GalleryImage[] {
  const images = (product.images ?? [])
    .map((image) => ({ id: image.id, url: resolveImageUrl(image.url), alt: image.alt }))
    .filter((image): image is GalleryImage => Boolean(image.url));
  if (images.length === 0) {
    const fallback = resolveImageUrl(product.imageUrl);
    if (fallback) images.push({ id: 'legacy', url: fallback, alt: product.name });
  }
  return images;
}

async function loadRelatedProducts(product: Product): Promise<ProductSummary[]> {
  const filters: Array<Record<string, string>> = [];
  if (product.categories[0]) filters.push({ category: product.categories[0].slug });
  if (product.gender) filters.push({ gender: product.gender.toLowerCase() });
  if (product.brand) filters.push({ brand: product.brand });
  filters.push({});

  const related = new Map<string, ProductSummary>();
  for (const filter of filters) {
    try {
      const params = new URLSearchParams({ limit: '12', ...filter });
      const result = await getProducts(params);
      for (const item of result.data) {
        if (item.id !== product.id) related.set(item.id, item);
        if (related.size >= 4) break;
      }
    } catch (error) {
      console.error('No se pudieron cargar productos relacionados.', error);
    }
    if (related.size >= 4) break;
  }
  return [...related.values()].slice(0, 4);
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProduct(slug);
    const gallery = buildGallery(product);
    return createPageMetadata({
      title: product.name,
      description: product.description.slice(0, 155),
      path: `/shop/${product.slug}`,
      ...(gallery.length > 0 ? { images: [gallery[0].url] } : {}),
    });
  } catch {
    return {};
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  let product;
  try {
    product = await getProduct(slug);
  } catch {
    notFound();
  }

  const priceValue = Number(product.price);
  const price = formatPrice(priceValue);
  const gallery = buildGallery(product);
  const [relatedProducts, reviews] = await Promise.all([
    loadRelatedProducts(product),
    getProductReviews(product.id).catch((error: unknown) => {
      console.error('No se pudieron cargar las reseñas del producto.', error);
      return null;
    }),
  ]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    brand: { '@type': 'Brand', name: product.brand },
    description: product.description,
    ...(gallery.length > 0 ? { image: gallery.map((image) => image.url) } : {}),
    category: product.category,
    offers: {
      '@type': 'Offer',
      url: new URL(`/shop/${product.slug}`, SITE_URL).toString(),
      priceCurrency: 'ARS',
      price: product.price,
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <Header />
      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-2">
        <ProductGallery images={gallery} name={product.name} />
        <div className="self-center">
          <div className="flex items-start justify-between gap-4">
            <div>
              {product.brandSlug ? (
                <Link className="ul text-[11px] font-semibold uppercase tracking-[0.3em] text-muted" href={`/marcas/${product.brandSlug}`}>
                  {product.brand}
                </Link>
              ) : (
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">{product.brand}</p>
              )}
              <h1 className="mt-4 font-display text-6xl font-black uppercase leading-none tracking-[-0.02em]">{product.name}</h1>
            </div>
            <div className="shrink-0">
              <WishlistButton product={product} />
            </div>
          </div>
          <p className="mt-6 text-2xl font-semibold">{price}</p>
          <p className="mt-8 max-w-lg leading-7 text-muted">{product.description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            <span>{product.inStock ? 'Disponible para compra' : 'Agotado'}</span>
            {product.categories.map((category) => (
              <Link
                key={category.slug}
                className="ul border border-line px-3 py-1.5 text-[10px]"
                href={`/shop?categoria=${category.slug}`}
              >
                {category.name}
              </Link>
            ))}
          </div>
          {product.inStock && (
            <AddToCartButton
              productId={product.id}
              productName={product.name}
              productBrand={product.brand}
              productPrice={priceValue}
            />
          )}
        </div>
      </section>
      {relatedProducts.length > 0 && (
        <section aria-labelledby="related-products-title" className="mx-auto max-w-7xl px-6 pb-20">
          <div className="flex items-end justify-between gap-6">
            <h2 className="font-display text-4xl font-black uppercase tracking-[-0.02em]" id="related-products-title">
              También te puede gustar
            </h2>
            <Link className="ul hidden text-xs font-extrabold uppercase tracking-[0.18em] sm:block" href="/shop">
              Ver colección
            </Link>
          </div>
          <div className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((item) => <ProductCard key={item.id} product={item} />)}
          </div>
        </section>
      )}
      <ProductReviewsSection
        initialReviews={reviews}
        loadFailed={reviews === null}
        productId={product.id}
        productSlug={product.slug}
      />
    </main>
  );
}
