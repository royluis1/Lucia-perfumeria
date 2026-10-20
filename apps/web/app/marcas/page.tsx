import Link from 'next/link';
import { Header } from '../../components/header';
import { getBrands } from '../../lib/api';
import type { Metadata } from 'next';
import type { BrandSummary } from '../../lib/api';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Marcas',
  description: 'Todas las marcas de perfumes disponibles en Lucía Perfumería, con su colección completa.',
  alternates: { canonical: '/marcas' },
};

export default async function MarcasPage() {
  let brands: BrandSummary[] | null = null;
  try {
    brands = await getBrands();
  } catch {
    brands = null;
  }

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">Marcas</p>
        <h1 className="mt-3 font-display text-6xl font-black uppercase tracking-[-0.02em]">Nuestras marcas</h1>

        {brands === null ? (
          <p className="mt-16 border border-line bg-white p-8 text-sm leading-6 text-muted">
            No pudimos cargar las marcas en este momento. Intentalo de nuevo en unos minutos.
          </p>
        ) : brands.length === 0 ? (
          <p className="mt-16 border border-line bg-white p-8 text-muted">Todavía no hay marcas cargadas.</p>
        ) : (
          <div className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                className="group flex min-h-24 items-end justify-between border border-line bg-white p-6 transition hover:border-black hover:bg-sand"
                href={`/marcas/${brand.slug}`}
              >
                <span className="font-display text-2xl font-semibold leading-tight">{brand.name}</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted group-hover:text-ink">
                  {brand.productCount} {brand.productCount === 1 ? 'fragancia' : 'fragancias'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
