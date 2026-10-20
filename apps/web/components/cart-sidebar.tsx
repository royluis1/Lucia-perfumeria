'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '../lib/cart';
import { formatPrice } from '../lib/utils';
import { CartIcon, CloseIcon, MinusIcon, PlusIcon } from './icons';

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
        className="animate-fade-in fixed inset-0 z-40 bg-black/40"
        onClick={closeCart}
        aria-hidden="true"
      />
      <aside className="animate-slide-in fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-3">
          <h2 className="font-display text-xl font-black uppercase tracking-[0.2em]">Carrito</h2>
          <button
            className="flex h-11 w-11 items-center justify-center text-muted transition-colors hover:text-black"
            onClick={closeCart}
            aria-label="Cerrar carrito"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted">
              <CartIcon className="mb-4 h-16 w-16 text-black/15" />
              <p className="text-sm">Tu carrito está vacío</p>
              <Link className="btn-primary mt-4" href="/shop" onClick={closeCart}>
                Explorar productos
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="flex gap-4">
                <div className="relative h-20 w-16 flex-shrink-0 border border-line bg-white">
                  <div className="absolute inset-0 bg-gradient-to-b from-white to-sand" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div>
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted">{item.brand}</p>
                    <p className="mt-1 text-sm font-semibold">{formatPrice(item.price)}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
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
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="space-y-4 border-t border-line p-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="font-semibold">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Envío</span>
              <span className="font-semibold">{subtotal >= 100000 ? 'Gratis' : formatPrice(15000)}</span>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
              <span>Total</span>
              <span>{formatPrice(subtotal + (subtotal >= 100000 ? 0 : 15000))}</span>
            </div>
            <Link className="btn-primary w-full" href="/cart" onClick={closeCart}>
              Finalizar compra
            </Link>
            <p className="text-center text-xs text-muted">
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
