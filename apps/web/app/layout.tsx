import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lucía Perfumería',
  description: 'Perfumes y cosmética seleccionados para vos.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
