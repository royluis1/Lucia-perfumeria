import { notFound } from 'next/navigation';
import { Header } from '../../../components/header';
import { AddToCartButton } from '../../../components/add-to-cart-button';
import { getProduct } from '../../../lib/api';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

type ProductPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProduct(slug);
    return {
      title: product.name,
      description: product.description.slice(0, 155),
      alternates: { canonical: `/shop/${product.slug}` },
      openGraph: {
        title: `${product.name} · Lucía Perfumería`,
        description: product.description.slice(0, 155),
        type: 'website',
        url: `/shop/${product.slug}`,
        ...(product.imageUrl ? { images: [product.imageUrl] } : {}),
      },
    };
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
  const price = priceValue.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    brand: { '@type': 'Brand', name: product.brand },
    description: product.description,
    ...(product.imageUrl ? { image: [product.imageUrl] } : {}),
    sku: product.slug,
    category: product.category,
    offers: {
      '@type': 'Offer',
      url: `/shop/${product.slug}`,
      priceCurrency: 'ARS',
      price: product.price,
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-2">
        <div className="relative flex aspect-square items-end justify-center overflow-hidden bg-white p-16">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="absolute inset-0 h-full w-full object-cover" src={product.imageUrl} alt={product.name} />
          ) : (
            <div className="h-72 w-40 bg-gradient-to-b from-white to-black/10 shadow-xl" />
          )}
        </div>
        <div className="self-center">
          <p className="text-xs uppercase tracking-[0.3em] text-black/50">{product.brand}</p>
          <h1 className="mt-4 font-display text-6xl font-bold uppercase leading-none">{product.name}</h1>
          <p className="mt-6 text-2xl">{price}</p>
          <p className="mt-8 max-w-lg leading-7 text-black/65">{product.description}</p>
          <p className="mt-6 text-sm text-black/55">Disponible para compra</p>
          <AddToCartButton
            productId={product.id}
            productName={product.name}
            productBrand={product.brand}
            productPrice={priceValue}
          />
        </div>
      </section>
    </main>
  );
}
