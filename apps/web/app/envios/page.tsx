import type { Metadata } from 'next';
import { InfoPage } from '../../components/info-page';

export const metadata: Metadata = {
  title: 'Envíos y medios de pago',
  description: 'Consultas sobre envíos y medios de pago en Lucía Perfumería.',
  alternates: { canonical: '/envios' },
};

export default function EnviosPage() {
  return (
    <InfoPage
      eyebrow="Centro de ayuda"
      title="Envíos y medios de pago"
      sections={[
        {
          title: 'Envíos',
          content: [
            'Consultanos por Instagram o por teléfono para conocer las opciones de envío.',
          ],
        },
        {
          title: 'Medios de pago',
          content: [
            'Los pagos se realizan con Mercado Pago.',
          ],
        },
      ]}
    />
  );
}