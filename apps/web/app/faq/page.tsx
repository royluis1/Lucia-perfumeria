import type { Metadata } from 'next';
import { InfoPage } from '../../components/info-page';
import { siteConfig } from '../../lib/brand';

export const metadata: Metadata = {
  title: 'Preguntas frecuentes',
  description: 'Respuestas a las dudas más comunes sobre compras, envíos, pagos y devoluciones en Lucía Perfumería.',
  alternates: { canonical: '/faq' },
};

export default function FaqPage() {
  return (
    <InfoPage
      eyebrow="Centro de ayuda"
      title="Preguntas frecuentes"
      sections={[
        {
          title: 'Compras y pagos',
          content: [
            '¿Qué medio de pago puedo usar? Mercado Pago.',
            <>¿Tenés dudas sobre un producto o una compra? Consultanos por <a className="underline underline-offset-4" href={siteConfig.contact.instagramUrl} rel="noreferrer" target="_blank">Instagram</a> o por teléfono al <a className="underline underline-offset-4" href={siteConfig.contact.phoneHref}>{siteConfig.contact.phone}</a>.</>,
          ],
        },
        {
          title: 'Envíos',
          content: [
            'Consultanos por Instagram o por teléfono para conocer las opciones de envío.',
          ],
        },
        {
          title: 'Devoluciones y arrepentimiento',
          content: [
            'Para iniciar una solicitud de arrepentimiento, usá el botón disponible en el sitio. Para otras consultas, escribinos por Instagram o por teléfono.',
          ],
        },
        {
          title: 'Mi cuenta',
          content: [
            'Para consultas sobre tu cuenta, escribinos por Instagram o por teléfono.',
          ],
        },
      ]}
    />
  );
}