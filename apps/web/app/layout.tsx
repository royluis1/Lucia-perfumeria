import type { Metadata } from 'next';
import { SiteFooter } from '../components/site-footer';
import { CartProvider } from '../lib/cart';
import { CartSidebar } from '../components/cart-sidebar';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_WEB_APP_URL ?? 'https://lucia-perfumeria.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Lucía Perfumería',
    template: '%s · Lucía Perfumería',
  },
  description:
    'Perfumes y cosmética seleccionados para vos. Fragancias para mujer, hombre y nicho con precios en pesos. Comprá online o retirá en nuestro local.',
  keywords: ['perfumes', 'perfumería', 'cosmética', 'fragancias', 'Argentina', 'eau de parfum'],
  openGraph: {
    siteName: 'Lucía Perfumería',
    locale: 'es_AR',
    type: 'website',
    title: 'Lucía Perfumería',
    description: 'Perfumes y cosmética seleccionados para vos.',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lucía Perfumería',
    description: 'Perfumes y cosmética seleccionados para vos.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <CartProvider>
          {children}
          <CartSidebar />
        </CartProvider>
        <SiteFooter />
      </body>
    </html>
  );
}
