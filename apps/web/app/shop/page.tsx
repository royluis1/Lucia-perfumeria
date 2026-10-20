import { CatalogFilters } from '../../components/catalog-filters';
import { ProductCard } from '../../components/product-card';
import { Header } from '../../components/header';
import { SortSelect } from '../../components/sort-select';
import { getCategories, getProducts } from '../../lib/api';
import type { Metadata } from 'next';
import type { ProductList, ProductSort } from '../../lib/api';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Colección completa',
  description: 'Explorá la colección completa de fragancias de Lucía Perfumería: mujer, hombre y nicho.',
  alternates: { canonical: '/shop' },
};

const sortOptions: ProductSort[] = ['recent', 'name', 'price_asc', 'price_desc'];

type ShopPageProps = {
  searchParams: Promise<{
    q?: string;
    search?: string;
    category?: string;
    categoria?: string;
    genero?: string;
    sort?: string;
    page?: string;
  }>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const search = params.search ?? params.q;
  const categoria = params.categoria ?? params.category;
  const genero = params.genero;
  const query = new URLSearchParams();
  if (search) query.set('search', search);
  if (categoria) query.set('category', categoria);
  if (genero) query.set('gender', genero);
  if (params.sort) query.set('sort', params.sort);
  if (params.page) query.set('page', params.page);

  let products: ProductList | null = null;
  try {
    products = await getProducts(query);
  } catch {
    products = null;
  }
  const categories = await getCategories();
  const currentSort = sortOptions.includes(params.sort as ProductSort) ? (params.sort as ProductSort) : 'recent';

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">Colección completa</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
          <h1 className="font-display text-6xl font-black uppercase tracking-[-0.02em]">Encontrá tu aroma</h1>
          <form className="flex border-b border-black" action="/shop">
            {categoria ? <input name="categoria" type="hidden" value={categoria} /> : null}
            {genero ? <input name="genero" type="hidden" value={genero} /> : null}
            {params.sort ? <input name="sort" type="hidden" value={params.sort} /> : null}
            <input className="w-56 bg-transparent py-3 text-sm outline-none" defaultValue={search} name="search" placeholder="Buscar por nombre, marca o aroma" />
            <button className="px-2 text-sm" type="submit" aria-label="Buscar">→</button>
          </form>
        </div>

        <div className="mt-8 space-y-5">
          <CatalogFilters basePath="/shop" categories={categories} current={{ genero, categoria, search, sort: params.sort }} />
          <SortSelect action="/shop" hidden={{ search, categoria, genero }} value={currentSort} />
        </div>

        {products === null ? (
          <p className="mt-16 border border-line bg-white p-8 text-sm leading-6 text-muted">
            No pudimos conectar con el catálogo en este momento. Intentalo de nuevo en unos minutos.
          </p>
        ) : products.data.length > 0 ? (
          <div className="mt-12 grid gap-x-5 gap-y-12 md:grid-cols-3">
            {products.data.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <p className="mt-16 border border-line bg-white p-8 text-muted">No encontramos productos para esta búsqueda.</p>
        )}
      </section>
    </main>
  );
}
