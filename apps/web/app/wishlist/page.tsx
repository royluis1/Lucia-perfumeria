'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '../../components/header';
import { useWishlist } from '../../lib/wishlist';
import { getAccessToken } from '../../lib/auth';

export default function WishlistPage() {
  const { items, remove } = useWishlist();
  const [removing, setRemoving] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isGuest = !isClient || !getAccessToken();

  async function handleRemove(productId: string) {
    setRemoving(productId);
    try {
      await remove(productId);
    } catch {
      setRemoving(null);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-16">
      <Header />
      <p className="mt-10 text-xs uppercase tracking-[0.3em] text-black/50">Tu lista</p>
      <div className="mt-10 space-y-4">
        {isGuest || items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-black/50">
            <HeartIcon className="h-24 w-24 mb-6 text-black/20" />
            <h1 className="font-display text-4xl font-bold uppercase mb-4">
              {isGuest ? 'Iniciá sesión para guardar favoritos' : 'Tu lista de favoritos está vacía'}
            </h1>
            <p className="mb-8 max-w-md">
              {isGuest
                ? 'Iniciá sesión para guardar tus perfumes favoritos en un solo lugar.'
                : 'Todavía no guardaste ningún perfume. ¡Explorá nuestra colección y tocá el corazón!'}
            </p>
            <Link
              className="border border-black bg-black px-8 py-4 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-gold hover:text-black"
              href={isGuest ? '/login' : '/shop'}
            >
              {isGuest ? 'Iniciar sesión' : 'Ir a la tienda'}
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-display text-5xl font-bold uppercase tracking-[-0.03em]">
              Mis favoritos
            </h1>
            <div className="space-y-4">
              {items.map((item) => {
                const priceValue = Number(item.product.price);
                return (
                  <div key={item.product.id} className="flex gap-4 border-b border-black/10 py-5">
                    <Link href={`/shop/${item.product.slug}`} className="relative h-24 w-20 flex-shrink-0 bg-white border border-black/10 overflow-hidden">
                      {item.product.imageUrl ? (
                        <img className="h-full w-full object-cover" src={item.product.imageUrl} alt={item.product.name} />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-b from-white to-black/10" />
                      )}
                    </Link>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h2 className="font-semibold">
                          <Link className="hover:text-gold transition-colors" href={`/shop/${item.product.slug}`}>{item.product.name}</Link>
                        </h2>
                        <p className="text-sm text-black/55">{item.product.brand}</p>
                      </div>
                      <button
                        className="text-xs text-black/50 hover:text-red-600 transition-colors disabled:opacity-40 self-start"
                        onClick={() => handleRemove(item.product.id)}
                        disabled={removing === item.product.id}
                        aria-label={`Quitar ${item.product.name} de favoritos`}
                      >
                        {removing === item.product.id ? 'Quitando...' : 'Quitar'}
                      </button>
                    </div>
                    <p className="font-semibold self-center">
                      {priceValue.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="text-xs uppercase tracking-[0.16em] text-black/50">
              {items.length} {items.length === 1 ? 'producto guardado' : 'productos guardados'}
            </p>
          </>
        )}
      </div>
    </main>
  );
}

function HeartIcon({ className = 'h-24 w-24' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}