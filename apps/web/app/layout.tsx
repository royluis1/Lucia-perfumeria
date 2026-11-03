import type { Metadata, Viewport } from 'next';
import { Archivo } from 'next/font/google';
import localFont from 'next/font/local';
import { SiteFooter } from '../components/site-footer';
import { CartProvider } from '../lib/cart';
import { WishlistProvider } from '../lib/wishlist';
import { CartSidebar } from '../components/cart-sidebar';
import { AnalyticsScripts } from '../components/analytics-scripts';
import { SITE_URL } from '../lib/config';
import { siteConfig } from '../lib/brand';
import './globals.css';

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '600', '800', '900'],
  variable: '--font-archivo',
  display: 'swap',
});

const bodoni = localFont({
  src: '../assets/fonts/lucia-name.woff2',
  variable: '--font-bodoni',
  display: 'swap',
  weight: '600',
  style: 'italic',
  preload: false,
});

const cormorant = localFont({
  src: '../assets/fonts/lucia-sub.woff2',
  variable: '--font-cormorant',
  display: 'swap',
  weight: '300',
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`,
  },
  description:
    'Perfumes y cosmética en Villa Mercedes, San Luis.',
  keywords: ['perfumes', 'perfumería', 'cosmética', 'fragancias', 'Argentina', 'eau de parfum'],
  openGraph: {
    siteName: siteConfig.name,
    locale: 'es_AR',
    type: 'website',
    title: siteConfig.name,
    description: 'Perfumes y cosmética en Villa Mercedes, San Luis.',
    url: SITE_URL,
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: 'Perfumes y cosmética en Villa Mercedes, San Luis.',
    images: ['/opengraph-image'],
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className={`${archivo.variable} ${bodoni.variable} ${cormorant.variable}`} lang="es">
      <body>
        <AnalyticsScripts />
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
