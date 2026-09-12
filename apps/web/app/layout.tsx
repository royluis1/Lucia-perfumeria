import type { Metadata } from 'next';
import { SiteFooter } from '../components/site-footer';
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
      <body>{children}<SiteFooter /></body>
    </html>
  );
}
