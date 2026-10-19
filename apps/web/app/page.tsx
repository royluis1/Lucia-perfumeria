import { Header } from '../components/header';
import { ProductCard } from '../components/product-card';
import { COMPANY, LEGAL_LINKS } from '../lib/brand';
import { getHome, resolveImageUrl } from '../lib/api';
import type { HomeData } from '../lib/api';

const fallbackCategoryNames = ['Mujer', 'Hombre', 'Niños', 'Nicho'];

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

type Category = { name: string; href: string };

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
  const heroSubtitle =
    home?.hero.subtitle?.trim() ||
    heroDefaults.subtitle;
  const heroButtonLabel = home?.hero.buttonLabel?.trim() || heroDefaults.buttonLabel;
  const heroButtonHref = heroProduct ? `/shop/${heroProduct.slug}` : '/shop';
  const homeCategories: Category[] =
    home && home.categories.length >= 2
      ? home.categories.map((name) => ({ name, href: `/shop?category=${encodeURIComponent(name)}` }))
      : fallbackCategoryNames.map((name) => ({ name, href: `#${name}` }));
  const featured = home?.featured ?? [];
  return (
    <main>
      <Header />
      <section className="mx-auto grid min-h-[70vh] max-w-7xl items-end gap-10 px-6 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
        <div>
          <p className="mb-6 text-xs uppercase tracking-[0.3em] text-black/60">Nueva colección / 2026</p>
          <h1 className="max-w-3xl font-display text-6xl font-black uppercase leading-[0.88] tracking-[-0.04em] md:text-8xl">
            {heroTitle}
          </h1>
          <p className="mt-8 max-w-md text-base leading-7 text-black/65">{heroSubtitle}</p>
          <a
            className="mt-10 inline-flex border border-black bg-black px-7 py-4 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-gold hover:text-black"
            href={heroButtonHref}
          >
            {heroButtonLabel}
          </a>
        </div>
        <div className="relative flex aspect-[4/5] items-end justify-center overflow-hidden bg-gold-soft p-10">
          {heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="absolute inset-0 h-full w-full object-cover"
              src={heroImage}
              alt={heroProduct?.name ?? 'Lucía Perfumería'}
            />
          ) : !heroProduct ? (
            <div className="w-44 border border-black/20 bg-white/70 px-6 py-12 text-center shadow-xl">
              <p className="font-display text-4xl font-bold tracking-[0.12em]">L</p>
              <p className="mt-3 text-[10px] uppercase tracking-[0.28em]">Lucía</p>
              <p className="mt-10 text-[9px] uppercase tracking-[0.2em]">Parfum</p>
            </div>
          ) : null}
          {heroProduct ? (
            <a
              className="relative z-10 w-full border border-black/10 bg-white/95 px-6 py-4 backdrop-blur transition hover:border-gold"
              href={`/shop/${heroProduct.slug}`}
            >
              <p className="font-display text-2xl font-bold uppercase leading-none">{heroProduct.name}</p>
              <div className="mt-3 flex items-center justify-between gap-4 text-xs uppercase tracking-[0.14em] text-black/60">
                <span>{heroProduct.brand}</span>
                <span className="font-bold text-black">{formatPrice(heroProduct.price)}</span>
              </div>
            </a>
          ) : null}
        </div>
      </section>

      <section className="border-y border-black/10 bg-white px-6 py-16" id="categorias">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs uppercase tracking-[0.3em] text-black/50">Encontrá tu aroma</p>
          <div className="mt-8 grid gap-3 md:grid-cols-4">
            {homeCategories.map((category) => (
              <a className="border border-black/15 px-6 py-8 text-2xl font-semibold transition hover:border-gold hover:bg-gold-soft" href={category.href} key={category.name}>
                {category.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20" id="coleccion">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-black/50">Selección Lucía</p>
            <h2 className="mt-3 font-display text-5xl font-bold uppercase tracking-[-0.03em]">Favoritos</h2>
          </div>
          <a className="hidden text-xs font-bold uppercase tracking-[0.18em] underline md:block" href="/shop">Ver todo</a>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {featured.length > 0
            ? featured.map((product) => <ProductCard key={product.id} product={product} />)
            : featuredFallback.map((product) => (
                <article key={product.name}>
                  <a className="block" href="/shop">
                    <div className="flex aspect-[4/5] items-end justify-center bg-white p-10">
                      <div className="h-52 w-28 bg-gradient-to-b from-white to-black/10 shadow-xl" />
                    </div>
                    <div className="flex justify-between gap-4 pt-5">
                      <div>
                        <h3 className="font-semibold">{product.name}</h3>
                        <p className="mt-1 text-sm text-black/55">{product.brand}</p>
                      </div>
                      <p className="text-sm font-semibold">{product.price}</p>
                    </div>
                  </a>
                </article>
              ))}
        </div>
      </section>

      <section className="bg-black px-6 py-20 text-white" id="historia">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">El ritual también es tuyo</p>
          <h2 className="mt-5 font-display text-5xl font-bold uppercase leading-none md:text-7xl">Elegí sentirte vos.</h2>
          <p className="mx-auto mt-7 max-w-xl leading-7 text-white/65">
            Creamos una experiencia simple y cuidada para descubrir nuevas
            fragancias, encontrar tus clásicos y hacer de cada compra un momento especial.
          </p>
        </div>
      </section>

      <footer className="border-t border-black/10 px-6 py-12">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <h2 className="max-w-sm font-display text-3xl font-bold uppercase leading-none">Recibí nuestras ofertas y novedades por mail</h2>
            <form className="mt-8 flex max-w-md border-b border-black" action="#">
              <input aria-label="Correo electrónico" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none" placeholder="Correo electrónico" type="email" />
              <button className="px-3 text-xl" aria-label="Suscribirme" type="submit">→</button>
            </form>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.18em]">Ayuda</h3>
            <ul className="mt-5 space-y-3 text-sm text-black/65">
              <li><a href="/faq">Preguntas frecuentes</a></li>
              <li><a href="/envios">Envíos y medios de pago</a></li>
              <li><a href="/terminos">Términos y condiciones</a></li>
              <li><a href="/contacto">Contacto</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.18em]">Lucía Perfumería</h3>
            <p className="mt-5 text-sm leading-6 text-black/65">© 2026 Lucía Perfumería. Todos los derechos reservados.</p>
            <p className="mt-3 border-t border-black/10 pt-3 text-xs leading-5 text-black/50">{COMPANY.legalName} · CUIT {COMPANY.cuit} · {COMPANY.address}</p>
            <a
              className="mt-5 inline-block border border-black px-4 py-3 text-xs font-bold uppercase tracking-[0.12em]"
              href={LEGAL_LINKS.arrepentimiento}
            >
              Botón de arrepentimiento
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
