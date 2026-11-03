import { InfoPage } from '../../components/info-page';
import { LEGAL_LINKS, siteConfig } from '../../lib/brand';
import { createPageMetadata } from '../../lib/metadata';
import { StoreLocationInfo } from '../../components/store-location-info';

export const metadata = createPageMetadata({
  title: 'Contacto',
  description: 'Escribinos para resolver dudas, consultar por un pedido o iniciar un arrepentimiento.',
  path: '/contacto',
});

export default function ContactoPage() {
  return (
    <InfoPage
      eyebrow="Ayuda"
      title="Contacto"
      intro="Consultanos por Instagram o por teléfono."
      sections={[
        {
          title: 'Canales',
          content: [
            <>Instagram: <a className="underline underline-offset-4" href={siteConfig.contact.instagramUrl} rel="noreferrer" target="_blank">@luciaperfumesvm</a></>,
            <>Facebook: <a className="underline underline-offset-4" href={siteConfig.contact.facebookUrl} rel="noreferrer" target="_blank">Lucía Perfumería Villa Mercedes</a></>,
            <>Teléfono: <a className="underline underline-offset-4" href={siteConfig.contact.phoneHref}>{siteConfig.contact.phone}</a></>,
            <>Correo: <a className="underline underline-offset-4" href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a></>,
          ],
        },
      ]}
    >
      <StoreLocationInfo />
      <div className="mt-10 border border-line bg-gold-soft px-6 py-8">
        <h2 className="font-display text-2xl font-black uppercase tracking-[-0.02em]">¿Querés revocar una compra?</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          Para iniciar una solicitud de arrepentimiento, usá el botón disponible en el sitio.
        </p>
        <a className="mt-5 inline-block border border-black bg-black px-5 py-3 text-xs font-extrabold uppercase tracking-[0.22em] text-white transition hover:bg-white hover:text-black" href={LEGAL_LINKS.arrepentimiento}>
          Botón de arrepentimiento
        </a>
      </div>
    </InfoPage>
  );
}