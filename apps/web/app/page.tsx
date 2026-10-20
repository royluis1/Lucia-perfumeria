import { Header } from '../components/header';
import { ProductCard } from '../components/product-card';
import { SmartImage } from '../components/smart-image';
import { TrustMarquee } from '../components/trust-marquee';
import { BenefitsRow } from '../components/benefits-row';
import { HeroSeal } from '../components/hero-seal';
import { getHome, resolveImageUrl } from '../lib/api';
import type { HomeData } from '../lib/api';

const heroDefaults = {
  title: 'Una esencia para cada versión de vos.',
  subtitle: 'Fragancias y cosmética seleccionadas para acompañar tus rituales cotidianos.',
  buttonLabel: 'Explorar colección',
};

const featuredFallback = [
  { name: 'Eau de Parfum No. 01', brand: 'Floral amaderado', price: '$ 89.900' },
  { name: 'Eau de Parfum No. 02', brand: 'Ámbar especiado', price: '$ 94.500' },
  { name: 'Eau de Parfum No. 03', brand: 'Cítrico fresco', price: '$ 76.200' },
];

function formatPrice(value: string | number): string {
  return Number(value).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
}

async function loadHome(): Promise<HomeData | null> {
  try {
    return await getHome();
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const home = await loadHome();
  const heroProduct = home?.hero.product ?? null;
  const heroImage = resolveImageUrl(home?.hero.imageUrl ?? null);
  const heroTitle = home?.hero.title?.trim() || heroDefaults.title;
  const heroSubtitle = home?.hero.subtitle?.trim() || heroDefaults.subtitle;
  const heroButtonLabel = home?.hero.buttonLabel?.trim() || heroDefaults.buttonLabel;
  const heroButtonHref = heroProduct ? `/shop/${heroProduct.slug}` : '/shop';
  const featured = home?.featured ?? [];
  const titleWords = heroTitle.split(/\s+/);

  return (
    <main>
      <Header />

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-12 md:grid-cols-[1.05fr_0.95fr] md:pt-16">
        <div>
          <p className="rv d1 text-xs font-semibold uppercase tracking-[0.3em] text-muted">Nueva colección / 2026</p>
          <h1 className="mt-6 max-w-3xl font-display text-5xl font-black uppercase leading-[0.92] tracking-[-0.02em] md:text-7xl">
            {titleWords.map((word, index) => (
              <span className="lt mr-[0.28em] inline-block" key={`${word}-${index}`}>
                {index === titleWords.length - 1 ? <span className="shine">{word}</span> : word}
              </span>
            ))}
          </h1>
          <p className="rv d2 mt-8 max-w-md text-base leading-7 text-muted">{heroSubtitle}</p>
          <div className="rv d3 mt-10 flex flex-wrap items-center gap-6">
            <a className="btn-primary" href={heroButtonHref}>{heroButtonLabel}</a>
            <a className="ul text-xs font-extrabold uppercase tracking-[0.22em]" href="/shop">Ver toda la colección</a>
          </div>
        </div>

        <div className="rv d3">
          <div className="relative flex aspect-[4/5] items-end justify-center overflow-hidden bg-sand p-8">
            <span aria-hidden="true" className="glow pointer-events-none absolute left-1/2 top-16 h-64 w-64 -translate-x-1/2 rounded-full bg-white/60 blur-3xl" />

            {heroImage ? (
              <>
                <div className="float absolute inset-x-8 bottom-20 top-12">
                  <SmartImage
                    alt={heroProduct?.name ?? 'Lucía Perfumería'}
                    className="object-contain"
                    priority
                    sizes="(min-width: 768px) 40vw, 90vw"
                    src={heroImage}
                  />
                </div>
                <span aria-hidden="true" className="sh absolute bottom-12 left-1/2 h-4 w-44 -translate-x-1/2 rounded-full bg-black/50 blur-md" />
              </>
            ) : heroProduct ? (
              <div className="float relative z-10 mb-12 h-64 w-36 bg-gradient-to-b from-white to-black/10 shadow-xl" />
            ) : (
              <div className="float relative z-10 mb-12 w-44 border border-black/10 bg-white/70 px-6 py-12 text-center shadow-xl">
                <p className="font-display text-4xl font-black tracking-[0.12em]">L</p>
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.28em]">Lucía</p>
                <p className="mt-10 text-[9px] font-semibold uppercase tracking-[0.2em]">Parfum</p>
              </div>
            )}

            <HeroSeal className="absolute right-5 top-5 h-24 w-24 text-black/60" />

            {heroProduct && (
              <a
                className="relative z-10 w-full border border-line bg-white/95 px-6 py-4 backdrop-blur transition-colors hover:border-black"
                href={`/shop/${heroProduct.slug}`}
              >
                <p className="font-display text-2xl font-black uppercase leading-none tracking-[-0.02em]">{heroProduct.name}</p>
                <div className="mt-3 flex items-center justify-between gap-4 text-xs uppercase tracking-[0.18em] text-muted">
                  <span>{heroProduct.brand}</span>
                  <span className="font-extrabold text-ink">{formatPrice(heroProduct.price)}</span>
                </div>
              </a>
            )}
          </div>
        </div>
      </section>

      <TrustMarquee />

      <section className="mx-auto max-w-7xl px-6 py-20" id="favoritos">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">Selección Lucía</p>
            <h2 className="mt-3 font-display text-5xl font-black uppercase tracking-[-0.02em]">Favoritos</h2>
          </div>
          <a className="ul hidden text-xs font-extrabold uppercase tracking-[0.22em] md:block" href="/shop">Ver todo</a>
        </div>
        <div className="mt-12 grid gap-x-5 gap-y-12 md:grid-cols-3">
          {featured.length > 0
            ? featured.map((product, index) => (
                <div className={`rv d${Math.min(index + 1, 3)}`} key={product.id}>
                  <ProductCard product={product} />
                </div>
              ))
            : featuredFallback.map((product, index) => (
                <article className={`card rv d${Math.min(index + 1, 3)}`} key={product.name}>
                  <div className="relative aspect-[4/5] overflow-hidden bg-sand">
                    <span className="flex h-full w-full items-end justify-center p-10">
                      <span className="img block h-52 w-28 bg-gradient-to-b from-white to-black/10 shadow-xl transition" />
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 pt-5">
                    <div>
                      <h3 className="text-sm font-semibold">{product.name}</h3>
                      <p className="mt-1 text-sm text-muted">{product.brand}</p>
                    </div>
                    <p className="text-sm font-semibold">{product.price}</p>
                  </div>
                </article>
              ))}
        </div>
      </section>

      <BenefitsRow />
    </main>
  );
}
