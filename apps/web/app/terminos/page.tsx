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
      intro="Estos términos regulan el uso del sitio y la compra de productos de Lucía Perfumería."
      sections={[
        {
          title: 'Productos y precios',
          content: [
            'Los precios publicados están expresados en pesos argentinos (ARS) e incluyen IVA. Lucía Perfumería puede actualizarlos sin previo aviso; el precio vigente es el que se muestra al momento de confirmar la compra.',
          ],
        },
        {
          title: 'Compra y pago',
          content: [
            'Al confirmar la compra aceptás estos términos y garantizás que los datos ingresados son correctos. Las promociones no son acumulables salvo que se indique lo contrario.',
          ],
        },
        {
          title: 'Arrepentimiento',
          content: [
            'Podés revocar la compra dentro de los 10 días corridos desde la compra o la recepción del producto, por cualquier medio idóneo. Usá el botón de arrepentimiento para iniciar el trámite (Ley 24.240, art. 34).',
          ],
        },
        {
          title: 'Responsabilidad',
          content: [
            'Las imágenes son de carácter ilustrativo. Ante dudas sobre un producto, contactanos antes de comprar para evitar devoluciones innecesarias.',
          ],
        },
      ]}
    />
  );
}