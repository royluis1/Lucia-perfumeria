const links = {
  about: ['Trabajá con nosotros', 'Catálogo mayorista', 'Nuestros locales', 'Eventos'],
  help: ['Seguimiento de envío', 'Preguntas frecuentes', 'Envíos y medios de pago', 'Términos y condiciones'],
};

export function SiteFooter() {
  return (
    <footer className="border-t border-black/10 bg-canvas px-6 py-16">
      <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <h2 className="max-w-sm font-display text-3xl font-bold uppercase leading-none">
            Recibí nuestras ofertas y novedades por mail
          </h2>
          <form className="mt-8 flex max-w-md border-b border-black" action="#">
            <input aria-label="Correo electrónico" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none" placeholder="Correo electrónico" type="email" />
            <button aria-label="Suscribirme" className="px-3 text-xl" type="submit">→</button>
          </form>
          <p className="mt-10 font-display text-4xl font-bold tracking-[0.08em]">LUCÍA</p>
          <p className="mt-3 max-w-sm text-xs leading-5 text-black/50">© 2026 Lucía Perfumería. Todos los derechos reservados.</p>
        </div>
        <FooterColumn title="Acerca de nosotros" links={links.about} />
        <FooterColumn title="Centro de ayuda" links={links.help} />
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.18em]">Seguinos</h3>
          <div className="mt-5 flex flex-wrap gap-2">
            {['WA', 'IG', 'TK', 'YT', 'IN'].map((network) => (
              <a aria-label={network} className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-xs font-bold text-white transition hover:bg-gold hover:text-black" href="#" key={network}>{network}</a>
            ))}
          </div>
          <a className="mt-8 inline-block border border-black px-4 py-3 text-xs font-bold uppercase tracking-[0.12em]" href="#">Botón de arrepentimiento</a>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links: columnLinks }: { title: string; links: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-[0.18em]">{title}</h3>
      <ul className="mt-5 space-y-3 text-sm text-black/65">
        {columnLinks.map((link) => <li key={link}><a href="#">{link}</a></li>)}
      </ul>
    </div>
  );
}
