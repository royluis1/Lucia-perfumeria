import type { Metadata } from 'next';
import { InfoPage } from '../../components/info-page';
import { COMPANY, LEGAL_LINKS } from '../../lib/brand';

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Escribinos para resolver dudas, consultar por un pedido o iniciar un arrepentimiento.',
  alternates: { canonical: '/contacto' },
};

export default function ContactoPage() {
  return (
    <InfoPage
      eyebrow="Ayuda"
      title="Contacto"
      intro="Estamos para ayudarte. Elegí el canal que te quede más cómodo."
      sections={[
        {
          title: 'Canales',
          content: [
            `Correo: ${COMPANY.email}`,
            `Teléfono / WhatsApp: ${COMPANY.phone}`,
            `Local: ${COMPANY.address}`,
            'Horario de atención: lunes a viernes de 9 a 18 h.',
          ],
        },
      ]}
    >
      <div className="mt-10 border border-black/15 bg-gold-soft px-6 py-8">
        <h2 className="font-display text-2xl font-bold uppercase">¿Querés revocar una compra?</h2>
        <p className="mt-3 text-sm leading-6 text-black/65">
          No hace falta que contactes a un operador: usá el botón oficial y te respondemos por mail.
        </p>
        <a className="mt-5 inline-block border border-black bg-black px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-gold hover:text-black" href={LEGAL_LINKS.arrepentimiento}>
          Botón de arrepentimiento
        </a>
      </div>
    </InfoPage>
  );
}