import { ProductCard } from '../../components/product-card';
import { Header } from '../../components/header';
import { SortSelect } from '../../components/sort-select';
import { getProducts } from '../../lib/api';
import type { ProductSort } from '../../lib/api';

export const dynamic = 'force-dynamic';

const categories = ['Florales', 'Cítricos', 'Amaderados'];

const sortOptions: Array<{ value: ProductSort; label: string }> = [
  { value: 'recent', label: 'Novedades' },
  { value: 'name', label: 'Nombre A-Z' },
  { value: 'price_asc', label: 'Menor precio' },
  { value: 'price_desc', label: 'Mayor precio' },
];

type ShopPageProps = {
  searchParams: Promise<{ q?: string; search?: string; category?: string; sort?: string; page?: string }>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();
  const search = params.search ?? params.q;
  if (search) query.set('search', search);
  if (params.category) query.set('category', params.category);
  if (params.sort) query.set('sort', params.sort);
  if (params.page) query.set('page', params.page);

  const products = await getProducts(query);
  const currentSort = sortOptions.some((option) => option.value === params.sort) ? (params.sort as ProductSort) : 'recent';

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-black/50">Catálogo</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
          <h1 className="font-display text-6xl font-bold uppercase tracking-[-0.04em]">Encontrá tu aroma</h1>
          <form className="flex border-b border-black" action="/shop">
            <input className="w-56 bg-transparent py-3 text-sm outline-none" defaultValue={search} name="search" placeholder="Buscar por nombre, marca o aroma" />
            <button className="px-2 text-sm" type="submit" aria-label="Buscar">→</button>
          </form>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <a
              key={cat}
              className={`px-4 py-2 text-xs uppercase tracking-[0.12em] border transition ${
                params.category === cat
                  ? 'bg-black text-white'
                  : 'border-black/10 hover:border-gold hover:bg-gold-soft'
              }`}
              href={`/shop?${new URLSearchParams({
                ...(search ? { search } : {}),
                ...(params.sort ? { sort: params.sort } : {}),
                category: cat,
              }).toString()}`}
            >
              {cat}
            </a>
          ))}
          <SortSelect value={currentSort} search={search} category={params.category} />
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