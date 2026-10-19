'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '../../components/header';
import { HeartIcon } from '../../components/icons';
import { SmartImage } from '../../components/smart-image';
import { useWishlist } from '../../lib/wishlist';
import { getAccessToken } from '../../lib/auth';
import { resolveImageUrl } from '../../lib/api';

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
      <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">Tu lista</p>
      <div className="mt-10 space-y-4">
        {isGuest || items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted">
            <HeartIcon className="mb-6 h-24 w-24 text-black/15" />
            <h1 className="mb-4 font-display text-4xl font-black uppercase tracking-[-0.02em]">
              {isGuest ? 'Iniciá sesión para guardar favoritos' : 'Tu lista de favoritos está vacía'}
            </h1>
            <p className="mb-8 max-w-md">
              {isGuest
                ? 'Iniciá sesión para guardar tus perfumes favoritos en un solo lugar.'
                : 'Todavía no guardaste ningún perfume. ¡Explorá nuestra colección y tocá el corazón!'}
            </p>
            <Link className="btn-primary" href={isGuest ? '/login' : '/shop'}>
              {isGuest ? 'Iniciar sesión' : 'Ir a la tienda'}
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-display text-5xl font-black uppercase tracking-[-0.02em]">
              Mis favoritos
            </h1>
            <div className="space-y-4">
              {items.map((item) => {
                const priceValue = Number(item.product.price);
                return (
                  <div key={item.product.id} className="flex gap-4 border-b border-line py-5">
                    <Link href={`/shop/${item.product.slug}`} className="relative h-24 w-20 flex-shrink-0 overflow-hidden border border-line bg-white">
                      {item.product.imageUrl ? (
                        <SmartImage alt={item.product.name} sizes="80px" src={resolveImageUrl(item.product.imageUrl) ?? item.product.imageUrl} />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-b from-white to-sand" />
                      )}
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div>
                        <h2 className="font-semibold">
                          <Link className="transition-colors hover:text-black" href={`/shop/${item.product.slug}`}>{item.product.name}</Link>
                        </h2>
                        <p className="text-sm text-muted">{item.product.brand}</p>
                      </div>
                      <button
                        className="self-start text-xs font-semibold uppercase tracking-[0.18em] text-muted transition-colors hover:text-red-600 disabled:opacity-40"
                        onClick={() => handleRemove(item.product.id)}
                        disabled={removing === item.product.id}
                        aria-label={`Quitar ${item.product.name} de favoritos`}
                      >
                        {removing === item.product.id ? 'Quitando...' : 'Quitar'}
                      </button>
                    </div>
                    <p className="self-center font-semibold">
                      {priceValue.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
              {items.length} {items.length === 1 ? 'producto guardado' : 'productos guardados'}
            </p>
          </>
        )}
      </div>
    </main>
  );
}
