import Link from 'next/link';
import { LEGAL_LINKS, siteConfig } from '../lib/brand';
import { Logo } from './logo';
import { RoyTechAttribution } from './roytech-attribution';
import { FacebookIcon, InstagramIcon } from './icons';
import { StoreLocationInfo } from './store-location-info';

const links = {
  about: [
    { label: 'Colección completa', href: '/shop' },
    { label: 'Marcas', href: '/marcas' },
    { label: 'Nuestra historia', href: '/nosotros' },
  ],
  help: [
    { label: 'Envíos y medios de pago', href: '/envios' },
    { label: 'Preguntas frecuentes', href: '/faq' },
    { label: 'Contacto', href: '/contacto' },
    { label: 'Términos y condiciones', href: '/terminos' },
  ],
};

const social = [
  { label: 'Instagram', href: siteConfig.contact.instagramUrl, Icon: InstagramIcon },
  { label: 'Facebook', href: siteConfig.contact.facebookUrl, Icon: FacebookIcon },
];

export function SiteFooter() {
  return (
    <footer className="site-footer bg-black px-4 py-10 text-white sm:px-6 md:py-16">
      <div className="mx-auto grid max-w-7xl gap-7 sm:grid-cols-2 md:grid-cols-[1.3fr_1fr_1fr_1fr] md:gap-12">
        <div>
          <Logo className="text-2xl md:text-3xl" />
          <p className="mt-3 max-w-sm text-xs leading-5 text-white/65">© {new Date().getFullYear()} {siteConfig.name}. Todos los derechos reservados.</p>
          <div className="mt-4 hidden border-t border-white/15 pt-4 text-xs leading-5 text-white/65 md:block">
            <ContactDetails />
          </div>
          <details className="mt-4 border-t border-white/15 pt-2 md:hidden">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] [&::-webkit-details-marker]:hidden">
              Contacto
              <span aria-hidden="true">+</span>
            </summary>
            <div className="pb-3 text-xs leading-6 text-white/65">
              <ContactDetails />
            </div>
          </details>
        </div>
        <FooterColumn links={links.about} title="Acerca de nosotros" />
        <FooterColumn links={links.help} title="Centro de ayuda" />
        <div className="border-t border-white/15 pt-2 sm:border-t-0 sm:pt-0">
          <h3 className="hidden text-xs font-extrabold uppercase tracking-[0.22em] md:block">Seguinos</h3>
          <details className="md:hidden">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] [&::-webkit-details-marker]:hidden">
              Seguinos
              <span aria-hidden="true">+</span>
            </summary>
            <div className="pb-3">
              <SocialLinks />
            </div>
          </details>
          <div className="hidden md:block">
            <SocialLinks />
          </div>
          <Link
            className="mt-5 inline-flex min-h-11 items-center border border-white/40 px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.14em] transition-colors md:mt-8 md:text-xs md:tracking-[0.18em]"
            href={LEGAL_LINKS.arrepentimiento}
          >
            Botón de arrepentimiento
          </Link>
        </div>
      </div>
      <RoyTechAttribution />
    </footer>
  );
}

function ContactDetails() {
  return (
    <>
      {siteConfig.contact.legalName && <p>{siteConfig.contact.legalName}</p>}
      {siteConfig.contact.cuit && <p>CUIT {siteConfig.contact.cuit}</p>}
      <StoreLocationInfo compact />
      <p><a href={siteConfig.contact.phoneHref}>{siteConfig.contact.phone}</a></p>
      <p><a href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a></p>
    </>
  );
}

function SocialLinks() {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {social.map(({ label, href, Icon }) => (
        <a
          aria-label={label}
          className="footer-social-link flex h-11 w-11 items-center justify-center rounded-full border border-white/30 text-white"
          href={href}
          key={label}
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
    </div>
  );
}

function FooterColumn({ title, links: columnLinks }: { title: string; links: Array<{ label: string; href: string }> }) {
  return (
    <>
      <div className="border-t border-white/15 pt-2 md:hidden">
        <details>
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] [&::-webkit-details-marker]:hidden">
            {title}
            <span aria-hidden="true">+</span>
          </summary>
          <LinkList links={columnLinks} />
        </details>
      </div>
      <div className="hidden md:block">
        <h3 className="text-xs font-extrabold uppercase tracking-[0.22em]">{title}</h3>
        <LinkList links={columnLinks} />
      </div>
    </>
  );
}

function LinkList({ links: columnLinks }: { links: Array<{ label: string; href: string }> }) {
  return (
    <ul className="pb-3 text-sm text-white/65 md:mt-5 md:space-y-3">
      {columnLinks.map((link) => (
        <li key={link.label}>
          <Link className="flex min-h-11 items-center transition-colors md:min-h-0" href={link.href}>{link.label}</Link>
        </li>
      ))}
    </ul>
  );
}
