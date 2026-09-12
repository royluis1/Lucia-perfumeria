import { ProductCard } from '../../components/product-card';
import { getProducts } from '../../lib/api';

export const dynamic = 'force-dynamic';

type ShopPageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const products = await getProducts(new URLSearchParams({
    ...(params.q ? { q: params.q } : {}),
    ...(params.page ? { page: params.page } : {}),
  }));

  return (
    <main>
      <header className="border-b border-black/10 px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <a className="font-display text-xl font-bold tracking-[0.18em]" href="/">LUCÍA</a>
          <a className="text-xs uppercase tracking-[0.18em] underline" href="/">Volver al inicio</a>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-black/50">Catálogo</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
          <h1 className="font-display text-6xl font-bold uppercase tracking-[-0.04em]">Encontrá tu aroma</h1>
          <form className="flex border-b border-black" action="/shop">
            <input className="w-56 bg-transparent py-3 text-sm outline-none" defaultValue={params.q} name="q" placeholder="Buscar por nombre o marca" />
            <button className="px-2 text-sm" type="submit" aria-label="Buscar">→</button>
          </form>
        </div>
        {products.data.length > 0 ? (
          <div className="mt-12 grid gap-x-5 gap-y-12 md:grid-cols-3">
            {products.data.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <p className="mt-16 border border-black/10 bg-white p-8 text-black/65">No encontramos productos para esta búsqueda.</p>
        )}
      </section>
    </main>
  );
}
