'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '../lib/auth';
import { useWishlist } from '../lib/wishlist';
import type { Product } from '../lib/api';

export function WishlistButton({ product }: { product: Product }) {
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
      className={`flex h-9 w-9 items-center justify-center rounded-full border transition disabled:cursor-wait ${
        saved
          ? 'border-gold bg-gold text-white'
          : 'border-black/10 bg-white/90 text-black/60 backdrop-blur-sm hover:border-gold hover:text-gold'
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

function HeartIcon({ filled, className = 'h-5 w-5' }: { filled: boolean; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}