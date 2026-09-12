import { notFound } from 'next/navigation';
import { getProduct } from '../../../lib/api';

export const dynamic = 'force-dynamic';

type ProductPageProps = { params: Promise<{ slug: string }> };

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  let product;
  try {
    product = await getProduct(slug);
  } catch {
    notFound();
  }

  const price = Number(product.price).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  });

  return (
    <main>
      <header className="border-b border-black/10 px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <a className="font-display text-xl font-bold tracking-[0.18em]" href="/">LUCÍA</a>
          <a className="text-xs uppercase tracking-[0.18em] underline" href="/shop">Volver al catálogo</a>
        </div>
      </header>
      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-2">
        <div className="flex aspect-square items-end justify-center bg-white p-16">
          <div className="h-72 w-40 bg-gradient-to-b from-white to-black/10 shadow-xl" />
        </div>
        <div className="self-center">
          <p className="text-xs uppercase tracking-[0.3em] text-black/50">{product.brand}</p>
          <h1 className="mt-4 font-display text-6xl font-bold uppercase leading-none">{product.name}</h1>
          <p className="mt-6 text-2xl">{price}</p>
          <p className="mt-8 max-w-lg leading-7 text-black/65">{product.description}</p>
          <p className="mt-6 text-sm text-black/55">Disponible para compra</p>
          <button className="mt-8 border border-black bg-black px-8 py-4 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-gold hover:text-black" type="button">
            Agregar al carrito
          </button>
        </div>
      </section>
    </main>
  );
}
