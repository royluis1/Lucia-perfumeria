import type { Metadata } from 'next';
import { InfoPage } from '../../components/info-page';

export const metadata: Metadata = {
  title: 'Envíos y medios de pago',
  description: 'Plazos, costos de envío y medios de pago disponibles en Lucía Perfumería.',
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
            'Realizamos envíos a todo el país. CABA y GBA: 24 a 48 h hábiles. Interior: 3 a 7 días hábiles según la localidad, a través de correo privado.',
            'El costo de envío se calcula en el checkout según tu código postal y lo vas a ver antes de confirmar la compra. Por compras superiores a un monto determinado, el envío a CABA y GBA es sin cargo.',
          ],
        },
        {
          title: 'Medios de pago',
          content: [
            'Aceptamos tarjetas de crédito y débito (con procesamiento seguro vía Mercado Pago), y transferencia bancaria. En el caso de transferencia, el pedido se despacha una vez que se acredita el pago.',
          ],
        },
        {
          title: 'Facturación',
          content: [
            'Emitimos factura electrónica. Si necesitás factura A, escribinos con tu CUIT después de la compra y la enviramos por mail.',
          ],
        },
      ]}
    />
  );
}