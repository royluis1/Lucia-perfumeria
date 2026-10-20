import Link from 'next/link';
import { COMPANY, LEGAL_LINKS } from '../lib/brand';
import { Logo } from './logo';
import { FacebookIcon, InstagramIcon, MessageCircleIcon, YoutubeIcon } from './icons';

const links = {
  about: [
    { label: 'Colección completa', href: '/shop' },
    { label: 'Marcas', href: '/marcas' },
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

const social = [
  { label: 'Instagram', href: '#', Icon: InstagramIcon },
  { label: 'WhatsApp', href: '#', Icon: MessageCircleIcon },
  { label: 'Facebook', href: '#', Icon: FacebookIcon },
  { label: 'YouTube', href: '#', Icon: YoutubeIcon },
];

export function SiteFooter() {
  return (
    <footer className="bg-black px-6 py-16 text-white">
      <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <Logo className="text-3xl" />
          <p className="mt-4 max-w-sm text-xs leading-5 text-white/50">© 2026 Lucía Perfumería. Todos los derechos reservados.</p>
          <div className="mt-5 border-t border-white/15 pt-5 text-xs leading-5 text-white/50">
            <p>{COMPANY.legalName}</p>
            <p>CUIT {COMPANY.cuit}</p>
            <p>{COMPANY.address}</p>
            <p>{COMPANY.email}</p>
          </div>
        </div>
        <FooterColumn links={links.about} title="Acerca de nosotros" />
        <FooterColumn links={links.help} title="Centro de ayuda" />
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-[0.22em]">Seguinos</h3>
          <div className="mt-5 flex flex-wrap gap-2">
            {social.map(({ label, href, Icon }) => (
              <a
                aria-label={label}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:bg-white hover:text-black"
                href={href}
                key={label}
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
          <Link
            className="mt-8 inline-block border border-white/40 px-4 py-3 text-xs font-extrabold uppercase tracking-[0.18em] transition-colors hover:bg-white hover:text-black"
            href={LEGAL_LINKS.arrepentimiento}
          >
            Botón de arrepentimiento
          </Link>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links: columnLinks }: { title: string; links: Array<{ label: string; href: string }> }) {
  return (
    <div>
      <h3 className="text-xs font-extrabold uppercase tracking-[0.22em]">{title}</h3>
      <ul className="mt-5 space-y-3 text-sm text-white/60">
        {columnLinks.map((link) => (
          <li key={link.label}>
            <Link className="transition-colors hover:text-white" href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
