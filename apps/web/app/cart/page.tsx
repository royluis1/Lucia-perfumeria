'use client';

import Link from 'next/link';
import { Header } from '../../components/header';
import { useCart } from '../../lib/cart';
import { formatPrice } from '../../lib/utils';
import { ProductBottlePlaceholder } from '../../components/product-bottle-placeholder';

export default function CartPage() {
  const { items, subtotal, removeItem, updateQuantity, clearCart } = useCart();

  const shipping = subtotal >= 100000 ? 0 : 15000;
  const total = subtotal + shipping;

  return (
    <main className="mx-auto min-h-[100dvh] max-w-4xl px-4 py-8 sm:px-6 sm:py-12 md:py-16">
      <Header />
      <div className="mt-7 space-y-4 sm:mt-10">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted">
            <CartIcon className="h-24 w-24 mb-6 text-black/20" />
            <h1 className="mb-4 font-display text-[clamp(2rem,8vw,2.5rem)] font-black uppercase tracking-[-0.02em]">Tu carrito está vacío</h1>
            <p className="mb-8 max-w-md">Todavía no agregaste productos. ¡Explorá nuestra colección!</p>
            <Link className="border border-black bg-black px-8 py-4 text-xs font-extrabold uppercase tracking-[0.22em] text-white transition hover:bg-white hover:text-black" href="/shop">
              Ir a la tienda
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-display text-[clamp(2rem,8vw,2.5rem)] font-black uppercase tracking-[-0.02em]">Tu carrito</h1>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="grid grid-cols-[4rem_minmax(0,1fr)] gap-x-3 gap-y-3 border-b border-line py-5 sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:gap-x-4">
                  <div className="relative h-20 w-16 flex-shrink-0 bg-white border border-line">
                    <ProductBottlePlaceholder className="absolute inset-0" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h2 className="font-semibold">{item.name}</h2>
                      <p className="text-sm text-muted">{item.brand}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-line">
                        <button
                          className="flex h-11 w-11 items-center justify-center text-muted transition-colors hover:text-black"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          aria-label="Disminuir cantidad"
                        >
                          <MinusIcon className="h-4 w-4" />
                        </button>
                        <span className="px-2 text-sm font-medium">{item.quantity}</span>
                        <button
                          className="flex h-11 w-11 items-center justify-center text-muted transition-colors hover:text-black"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          aria-label="Aumentar cantidad"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        className="inline-flex min-h-11 items-center px-1 text-xs text-muted transition-colors hover:text-red-600"
                        onClick={() => removeItem(item.productId)}
                        aria-label={`Eliminar ${item.name}`}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <p className="col-start-2 text-right font-semibold sm:col-start-3 sm:self-center">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-line pt-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Envío</span>
                <span className="font-semibold">{shipping === 0 ? 'Gratis' : formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-line">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <Link className="block w-full border border-black bg-black px-8 py-4 text-center text-xs font-extrabold uppercase tracking-[0.22em] text-white transition hover:bg-white hover:text-black" href="/checkout">
                Continuar al checkout
              </Link>
              <Link className="mt-4 block text-center text-xs uppercase tracking-[0.16em] underline" href="/account/orders">Ver mis pedidos</Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function CartIcon({ className = 'h-24 w-24' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function MinusIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
    </svg>
  );
}

function PlusIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}
