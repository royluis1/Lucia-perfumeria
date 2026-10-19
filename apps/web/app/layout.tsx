import type { Metadata } from 'next';
import { Archivo } from 'next/font/google';
import { SiteFooter } from '../components/site-footer';
import { CartProvider } from '../lib/cart';
import { WishlistProvider } from '../lib/wishlist';
import { CartSidebar } from '../components/cart-sidebar';
import { SITE_URL } from '../lib/config';
import './globals.css';

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '600', '800', '900'],
  variable: '--font-archivo',
  display: 'swap',
});

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
    <html className={archivo.variable} lang="es">
      <body>
        <CartProvider>
          <WishlistProvider>
            {children}
            <CartSidebar />
          </WishlistProvider>
        </CartProvider>
        <SiteFooter />
      </body>
    </html>
  );
}
