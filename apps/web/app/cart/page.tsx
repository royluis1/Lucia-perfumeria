'use client';

import Link from 'next/link';
import { Header } from '../../components/header';
import { useCart } from '../../lib/cart';
import { formatPrice } from '../../lib/utils';

export default function CartPage() {
  const { items, subtotal, removeItem, updateQuantity, clearCart } = useCart();

  const shipping = subtotal >= 100000 ? 0 : 15000;
  const total = subtotal + shipping;

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-16">
      <Header />
      <div className="mt-10 space-y-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-black/50">
            <CartIcon className="h-24 w-24 mb-6 text-black/20" />
            <h1 className="font-display text-4xl font-bold uppercase mb-4">Tu carrito está vacío</h1>
            <p className="mb-8 max-w-md">Todavía no agregaste productos. ¡Explorá nuestra colección!</p>
            <Link className="border border-black bg-black px-8 py-4 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-gold hover:text-black" href="/shop">
              Ir a la tienda
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-4 border-b border-black/10 py-5">
                  <div className="relative h-20 w-16 flex-shrink-0 bg-white border border-black/10">
                    <div className="absolute inset-0 bg-gradient-to-b from-white to-black/10" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h2 className="font-semibold">{item.name}</h2>
                      <p className="text-sm text-black/55">{item.brand}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-black/10">
                        <button
                          className="p-2 text-black/60 hover:text-gold transition-colors"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          aria-label="Disminuir cantidad"
                        >
                          <MinusIcon className="h-4 w-4" />
                        </button>
                        <span className="px-3 text-sm font-medium">{item.quantity}</span>
                        <button
                          className="p-2 text-black/60 hover:text-gold transition-colors"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          aria-label="Aumentar cantidad"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        className="text-xs text-black/50 hover:text-red-600 transition-colors"
                        onClick={() => removeItem(item.productId)}
                        aria-label={`Eliminar ${item.name}`}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <p className="font-semibold self-center">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-black/10 pt-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-black/60">Subtotal</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black/60">Envío</span>
                <span className="font-semibold">{shipping === 0 ? 'Gratis' : formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-black/10">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <Link className="block w-full border border-black bg-black px-8 py-4 text-center text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-gold hover:text-black" href="/checkout">
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
