'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '../lib/cart';
import { formatPrice } from '../lib/utils';

export function CartSidebar() {
  const { items, subtotal, removeItem, updateQuantity, closeCart, isOpen } = useCart();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
        aria-hidden="true"
      />
      <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-white shadow-xl flex flex-col animate-slide-in">
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
          <h2 className="font-display text-xl font-bold tracking-[0.18em]">Carrito</h2>
          <button
            className="p-1 text-black/50 hover:text-gold transition-colors"
            onClick={closeCart}
            aria-label="Cerrar carrito"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-black/50">
              <CartIcon className="h-16 w-16 mb-4 text-black/20" />
              <p className="text-sm">Tu carrito está vacío</p>
              <Link
                className="mt-4 inline-flex border border-black bg-black px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-gold hover:text-black"
                href="/shop"
                onClick={closeCart}
              >
                Explorar productos
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="flex gap-4">
                <div className="relative h-20 w-16 flex-shrink-0 bg-white border border-black/10">
                  <div className="absolute inset-0 bg-gradient-to-b from-white to-black/10" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-black/50">{item.brand}</p>
                    <p className="mt-1 text-sm font-semibold">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
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
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-black/10 p-6 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-black/60">Subtotal</span>
              <span className="font-semibold">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-black/60">Envío</span>
              <span className="font-semibold">{subtotal >= 100000 ? 'Gratis' : formatPrice(15000)}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t border-black/10">
              <span>Total</span>
              <span>{formatPrice(subtotal + (subtotal >= 100000 ? 0 : 15000))}</span>
            </div>
            <Link
              className="block w-full border border-black bg-black px-6 py-4 text-center text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-gold hover:text-black"
              href="/cart"
              onClick={closeCart}
            >
              Finalizar compra
            </Link>
            <p className="text-center text-xs text-black/50">
              {subtotal < 100000
                ? `Te faltan ${formatPrice(100000 - subtotal)} para envío gratis`
                : '¡Envío gratis incluido!'}
            </p>
          </div>
        )}
      </aside>
    </>
  );
}

function CartIcon({ className = 'h-16 w-16' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function CloseIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
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