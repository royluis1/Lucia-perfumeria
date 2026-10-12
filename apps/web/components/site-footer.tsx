import { COMPANY, LEGAL_LINKS } from '../lib/brand';

const links = {
  about: [
    { label: 'Nosotros', href: '/nosotros' },
    { label: 'Catálogo mayorista', href: '/contacto' },
    { label: 'Trabajá con nosotros', href: '/contacto' },
    { label: 'Eventos', href: '/contacto' },
  ],
  help: [
    { label: 'Envíos y medios de pago', href: '/envios' },
    { label: 'Preguntas frecuentes', href: '/faq' },
    { label: 'Contacto', href: '/contacto' },
    { label: 'Términos y condiciones', href: '/terminos' },
  ],
};

export function SiteFooter() {
  return (
    <footer className="border-t border-black/10 bg-canvas px-6 py-16">
      <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-4">
        <div>
          <p className="font-display text-4xl font-bold tracking-[0.08em]">LUCÍA</p>
          <p className="mt-3 max-w-sm text-xs leading-5 text-black/50">© 2026 Lucía Perfumería. Todos los derechos reservados.</p>
          <div className="mt-5 border-t border-black/10 pt-5 text-xs leading-5 text-black/50">
            <p>{COMPANY.legalName}</p>
            <p>CUIT {COMPANY.cuit}</p>
            <p>{COMPANY.address}</p>
            <p>{COMPANY.email}</p>
          </div>
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
          <a className="mt-8 inline-block border border-black px-4 py-3 text-xs font-bold uppercase tracking-[0.12em]" href={LEGAL_LINKS.arrepentimiento}>Botón de arrepentimiento</a>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links: columnLinks }: { title: string; links: Array<{ label: string; href: string }> }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-[0.18em]">{title}</h3>
      <ul className="mt-5 space-y-3 text-sm text-black/65">
        {columnLinks.map((link) => <li key={link.label}><a href={link.href}>{link.label}</a></li>)}
      </ul>
    </div>
  );
}
