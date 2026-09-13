import type { Metadata } from 'next';
import { SiteFooter } from '../components/site-footer';
import { CartProvider } from '../lib/cart';
import { CartSidebar } from '../components/cart-sidebar';
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
