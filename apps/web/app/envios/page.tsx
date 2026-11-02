import { InfoPage } from '../../components/info-page';
import { createPageMetadata } from '../../lib/metadata';

export const metadata = createPageMetadata({
  title: 'Envíos y medios de pago',
  description: 'Consultas sobre envíos y medios de pago en Lucía Perfumería.',
  path: '/envios',
});

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