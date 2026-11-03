import { InfoPage } from '../../components/info-page';
import { createPageMetadata } from '../../lib/metadata';

export const metadata = createPageMetadata({
  title: 'Nuestra historia',
  description: 'Conocé la historia de Lucía Perfumería y qué nos hace elegir cada fragancia.',
  path: '/nosotros',
});

export default function NosotrosPage() {
  return (
    <InfoPage
      eyebrow="Institucional"
      title="Nuestra historia"
      intro="Lucía Perfumería nació como un proyecto familiar: la idea de que elegir una fragancia deja de ser una compra y se convierte en un ritual."
      sections={[
        {
          title: 'Qué hacemos',
          content: [
            'Seleccionamos fragancias y cosmética de marcas nacionales e importadas, cuidando que cada producto que ofrecemos valga la pena: probado, original y con buena relación precio-calidad.',
          ],
        },
        {
          title: 'Nuestros locales',
          content: [
            'Además de la tienda online, te esperamos en nuestra sucursal para oler, comparar y elegir con asesoramiento personalizado.',
          ],
        },
      ]}
    />
  );
}