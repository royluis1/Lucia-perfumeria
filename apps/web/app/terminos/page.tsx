import type { Metadata } from 'next';
import { InfoPage } from '../../components/info-page';

export const metadata: Metadata = {
  title: 'Términos y condiciones',
  description: 'Condiciones de uso y compra del sitio de Lucía Perfumería.',
  alternates: { canonical: '/terminos' },
};

export default function TerminosPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Términos y condiciones"
      intro="Para consultas sobre productos, compras o el uso del sitio, contactanos por Instagram o por teléfono."
      sections={[
        {
          title: 'Productos y precios',
          content: [
            'La información y disponibilidad de los productos se muestran en sus respectivas páginas. Consultanos si necesitás más detalles.',
          ],
        },
        {
          title: 'Compra y pago',
          content: [
            'Los pagos se realizan con Mercado Pago.',
          ],
        },
        {
          title: 'Arrepentimiento',
          content: [
            'Para iniciar una solicitud, usá el botón de arrepentimiento disponible en el sitio.',
          ],
        },
      ]}
    />
  );
}