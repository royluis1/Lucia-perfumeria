import type { Metadata } from 'next';
import { InfoPage } from '../../components/info-page';
import { COMPANY } from '../../lib/brand';

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: 'Cómo protegemos tus datos personales en Lucía Perfumería (Ley 25.326).',
  alternates: { canonical: '/privacidad' },
};

export default function PrivacidadPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Política de privacidad"
      intro="En Lucía Perfumería tratamos tus datos personales con responsabilidad y de acuerdo a la Ley 25.326 de Protección de Datos Personales."
      sections={[
        {
          title: 'Qué datos recopilamos',
          content: [
            'Recopilamos los datos que nos proporcionás al crear tu cuenta, hacer una compra o contactarnos: nombre, correo electrónico, teléfono y dirección de envío.',
          ],
        },
        {
          title: 'Para qué los usamos',
          content: [
            'Usamos tus datos para procesar y enviar tus pedidos, gestionar devoluciones, responder consultas y, si lo autorizaste, enviarte novedades y promociones.',
          ],
        },
        {
          title: 'Tus derechos',
          content: [
            'Podés solicitar acceso, rectificación o supresión de tus datos personales, o revocar tu consentimiento, escribiéndonos a {0}.',
          ].map((line) => line.replace('{0}', COMPANY.email)),
        },
      ]}
    />
  );
}