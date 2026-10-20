import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CatalogFilters } from '../../../components/catalog-filters';
import { ProductCard } from '../../../components/product-card';
import { Header } from '../../../components/header';
import { SortSelect } from '../../../components/sort-select';
import { getBrand } from '../../../lib/api';
import type { Metadata } from 'next';
import type { BrandDetail, ProductSort } from '../../../lib/api';

export const dynamic = 'force-dynamic';

const sortOptions: ProductSort[] = ['recent', 'name', 'price_asc', 'price_desc'];

type BrandPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ genero?: string; sort?: string; page?: string }>;
};

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const brand = await getBrand(slug);
    return {
      title: `${brand.name} — Perfumes`,
      description: `Descubrí todos los perfumes ${brand.name} disponibles en Lucía Perfumería.`,
      alternates: { canonical: `/marcas/${brand.slug}` },
    };
  } catch {
    return { title: 'Marca no encontrada' };
  }
}

export default async function BrandPage({ params, searchParams }: BrandPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const query = new URLSearchParams();
  if (sp.genero) query.set('gender', sp.genero);
  if (sp.sort) query.set('sort', sp.sort);
  if (sp.page) query.set('page', sp.page);

  let brand: BrandDetail | null = null;
  try {
    brand = await getBrand(slug, query);
  } catch {
    brand = null;
  }
  if (!brand) notFound();

  const currentSort = sortOptions.includes(sp.sort as ProductSort) ? (sp.sort as ProductSort) : 'recent';
  const basePath = `/marcas/${brand.slug}`;

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <Link className="ul text-[11px] font-semibold uppercase tracking-[0.22em] text-muted" href="/marcas">
          ← Todas las marcas
        </Link>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">Marca</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
          <h1 className="font-display text-6xl font-black uppercase tracking-[-0.02em]">{brand.name}</h1>
          <p className="text-sm text-muted">
            {brand.total} {brand.total === 1 ? 'fragancia' : 'fragancias'}
          </p>
        </div>

        <div className="mt-8 space-y-5">
          <CatalogFilters basePath={basePath} current={{ genero: sp.genero, sort: sp.sort }} />
          <SortSelect action={basePath} hidden={{ genero: sp.genero }} value={currentSort} />
        </div>

        {brand.data.length > 0 ? (
          <div className="mt-12 grid gap-x-5 gap-y-12 md:grid-cols-3">
            {brand.data.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <p className="mt-16 border border-line bg-white p-8 text-muted">
            No hay perfumes de esta marca con ese filtro.
          </p>
        )}
      </section>
    </main>
  );
}
