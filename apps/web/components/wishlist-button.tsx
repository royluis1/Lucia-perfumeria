'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWishlist } from '../lib/wishlist';
import { HeartIcon } from './icons';
import type { ProductSummary } from '../lib/api';

export function WishlistButton({ product }: { product: ProductSummary }) {
  const { isSaved, toggle } = useWishlist();
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState('');
  const [loginHref, setLoginHref] = useState('');
  const saved = isSaved(product.id);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  async function handleToggle() {
    setPending(true);
    setNotice('');
    setLoginHref('');
    try {
      const authenticated = await toggle(product);
      if (!authenticated) {
        const destination = `${window.location.pathname}${window.location.search}`;
        setLoginHref(`/login?redirect=${encodeURIComponent(destination)}`);
        setNotice('Iniciá sesión para guardar favoritos');
      } else {
        setNotice(saved ? 'Quitado de favoritos' : 'Favorito guardado');
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'No se pudieron actualizar los favoritos');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={saved ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        aria-pressed={saved}
        className={`flex h-11 w-11 items-center justify-center rounded-full border transition disabled:cursor-wait ${
          saved
            ? 'border-black bg-black text-white'
            : 'border-line bg-white/90 text-muted backdrop-blur-sm hover:border-black hover:text-black'
        }`}
        onClick={() => void handleToggle()}
        disabled={pending}
      >
        <HeartIcon filled={saved} className="h-4 w-4" />
      </button>
      {notice && (
        <span
          className="absolute right-0 top-full z-30 mt-2 w-max max-w-60 rounded border border-line bg-white px-3 py-2 text-right text-xs font-medium text-ink shadow-lg"
          role="status"
        >
          {notice}
          {loginHref && (
            <>
              {' '}
              <Link className="font-bold underline underline-offset-2" href={loginHref}>
                Ingresá
              </Link>
            </>
          )}
        </span>
      )}
    </div>
  );
}
