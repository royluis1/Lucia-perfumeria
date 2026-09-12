const categories = ['Mujer', 'Hombre', 'Niños', 'Nicho'];

const featuredProducts = [
  { name: 'Eau de Parfum No. 01', type: 'Floral amaderado', price: '$ 89.900' },
  { name: 'Eau de Parfum No. 02', type: 'Ámbar especiado', price: '$ 94.500' },
  { name: 'Eau de Parfum No. 03', type: 'Cítrico fresco', price: '$ 76.200' },
];

export default function HomePage() {
  return (
    <main>
      <header className="border-b border-black/10 bg-canvas">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a className="font-display text-xl font-bold tracking-[0.18em]" href="/">
            LUCÍA
          </a>
          <nav className="hidden gap-8 text-xs uppercase tracking-[0.16em] md:flex">
            <a href="/shop">Colección</a>
            <a href="#categorias">Categorías</a>
            <a href="#historia">Nuestra historia</a>
          </nav>
          <div className="flex items-center gap-4 text-xs uppercase tracking-[0.12em]">
            <button aria-label="Buscar productos" type="button">Buscar</button>
            <button aria-label="Abrir carrito" type="button">Carrito (0)</button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid min-h-[70vh] max-w-7xl items-end gap-10 px-6 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
        <div>
          <p className="mb-6 text-xs uppercase tracking-[0.3em] text-black/60">Nueva colección / 2026</p>
          <h1 className="max-w-3xl font-display text-6xl font-black uppercase leading-[0.88] tracking-[-0.04em] md:text-8xl">
            Una esencia para cada versión de vos.
          </h1>
          <p className="mt-8 max-w-md text-base leading-7 text-black/65">
            Fragancias y cosmética seleccionadas para acompañar tus rituales
            cotidianos.
          </p>
          <a
            className="mt-10 inline-flex border border-black bg-black px-7 py-4 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-gold hover:text-black"
            href="/shop"
          >
            Explorar colección
          </a>
        </div>
        <div className="flex aspect-[4/5] items-end justify-center bg-gold-soft p-10">
          <div className="w-44 border border-black/20 bg-white/70 px-6 py-12 text-center shadow-xl">
            <p className="font-display text-4xl font-bold tracking-[0.12em]">L</p>
            <p className="mt-3 text-[10px] uppercase tracking-[0.28em]">Lucía</p>
            <p className="mt-10 text-[9px] uppercase tracking-[0.2em]">Parfum</p>
          </div>
        </div>
      </section>

      <section className="border-y border-black/10 bg-white px-6 py-16" id="categorias">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs uppercase tracking-[0.3em] text-black/50">Encontrá tu aroma</p>
          <div className="mt-8 grid gap-3 md:grid-cols-4">
            {categories.map((category) => (
              <a className="border border-black/15 px-6 py-8 text-2xl font-semibold transition hover:border-gold hover:bg-gold-soft" href="#" key={category}>
                {category}
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
          {featuredProducts.map((product, index) => (
            <article key={product.name}>
              <div className={`flex aspect-[4/5] items-end justify-center p-10 ${index === 1 ? 'bg-black/10' : 'bg-white'}`}>
                <div className="h-52 w-28 bg-gradient-to-b from-white to-black/10 shadow-xl" />
              </div>
              <div className="flex justify-between gap-4 pt-5">
                <div>
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="mt-1 text-sm text-black/55">{product.type}</p>
                </div>
                <p className="text-sm font-semibold">{product.price}</p>
              </div>
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
              <li><a href="#">Preguntas frecuentes</a></li>
              <li><a href="#">Envíos y medios de pago</a></li>
              <li><a href="#">Términos y condiciones</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.18em]">Lucía Perfumería</h3>
            <p className="mt-5 text-sm leading-6 text-black/65">© 2026 Lucía Perfumería. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
