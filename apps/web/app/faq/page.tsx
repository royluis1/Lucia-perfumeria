import type { Metadata } from 'next';
import { InfoPage } from '../../components/info-page';

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
            '¿Qué medios de pago aceptan? Tarjetas de crédito y débito, Mercado Pago y transferencia bancaria. Los precios están expresados en pesos argentinos (ARS).',
            '¿Cómo sé que mi pedido fue registrado? Al confirmar la compra recibís un mail con el detalle y el número de pedido, y queda visible en tu cuenta.',
          ],
        },
        {
          title: 'Envíos',
          content: [
            'Hacemos envíos a todo el país. En CABA y GBA llegamos en 24 a 48 h hábiles; al resto del país el plazo depende del código postal.',
            'El costo se calcula al finalizar la compra según tu dirección. Ver más en la página de envíos y medios de pago.',
          ],
        },
        {
          title: 'Devoluciones y arrepentimiento',
          content: [
            'Tenés hasta 10 días corridos desde la compra o la recepción del producto para arrepentirte (Ley 24.240). Una vez registrado tu pedido de revocación, coordinamos la devolución del dinero en el mismo medio de pago.',
            'Si el producto llega en mal estado o equivocado, escribinos dentro de las 72 h de recibido con el número de pedido.',
          ],
        },
        {
          title: 'Mi cuenta',
          content: [
            '¿Olvidaste tu contraseña? Usá la opción "Recuperar contraseña" en el ingreso: te enviamos un link por mail para cambiarla.',
            'Activá la verificación en dos pasos desde tu cuenta para protegerla con un código generado por una app.',
          ],
        },
      ]}
    />
  );
}