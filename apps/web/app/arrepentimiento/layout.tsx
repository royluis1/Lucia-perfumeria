import { createPageMetadata } from '../../lib/metadata';

export const metadata = createPageMetadata({
  title: 'Botón de arrepentimiento',
  description: 'Iniciá una solicitud de arrepentimiento desde Lucía Perfumería.',
  path: '/arrepentimiento',
});

export default function ArrepentimientoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
