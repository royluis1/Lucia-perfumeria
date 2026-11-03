import { InfoPage } from '../../components/info-page';
import { siteConfig } from '../../lib/brand';
import { createPageMetadata } from '../../lib/metadata';

export const metadata = createPageMetadata({
  title: 'Política de privacidad',
  description: 'Borrador de política de privacidad de Lucía Perfumería.',
  path: '/privacidad',
});

export default function PrivacidadPage() {
  return (
    <InfoPage
      eyebrow="Legal · borrador"
      title="Política de privacidad"
      intro="Este texto es un borrador y debe revisarse con un abogado antes de publicarse como política definitiva."
      sections={[
        {
          title: 'Qué datos se guardan',
          content: [
            'Según cómo uses la tienda, podemos guardar los datos que proporcionás en tu cuenta, pedidos y consultas, como nombre, correo electrónico, teléfono y dirección de envío, además de la información necesaria para identificar y atender cada pedido.',
            'Los pagos se gestionan mediante Mercado Pago; no ingreses datos de tarjetas en formularios de contacto.',
          ],
        },
        {
          title: 'Para qué los usamos',
          content: [
            'Usamos esos datos para administrar la cuenta, gestionar pedidos y solicitudes, y responder consultas relacionadas con la compra o el servicio.',
            'Si se habilitan herramientas de medición como Google Analytics o Meta Pixel, pueden utilizarse datos técnicos de navegación según la configuración del sitio.',
          ],
        },
        {
          title: 'Cómo solicitar acceso o baja',
          content: [
            `Podés solicitar acceso, corrección o supresión de tus datos escribiéndonos a ${siteConfig.contact.email}.`,
            'La eliminación puede estar sujeta a la conservación de información que resulte necesaria para cumplir obligaciones legales o resolver operaciones pendientes.',
          ],
        },
      ]}
    />
  );
}