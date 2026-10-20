'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '../lib/auth';
import { useWishlist } from '../lib/wishlist';
import { HeartIcon } from './icons';
import type { ProductSummary } from '../lib/api';

export function WishlistButton({ product }: { product: ProductSummary }) {
  const { isSaved, toggle } = useWishlist();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const saved = isSaved(product.id);

  async function handleToggle() {
    if (!getAccessToken()) {
      router.push('/login');
      return;
    }
    setPending(true);
    setError('');
    try {
      await toggle(product);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron actualizar los favoritos');
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      aria-label={saved ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      aria-pressed={saved}
      className={`flex h-11 w-11 items-center justify-center rounded-full border transition disabled:cursor-wait ${
        saved
          ? 'border-black bg-black text-white'
          : 'border-line bg-white/90 text-muted backdrop-blur-sm hover:border-black hover:text-black'
      }`}
      onClick={handleToggle}
      disabled={pending}
    >
      <HeartIcon filled={saved} className="h-4 w-4" />
      {error && (
        <span className="sr-only" role="status">
          {error}
        </span>
      )}
    </button>
  );
}
