'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '../lib/cart';
import { useWishlist } from '../lib/wishlist';
import { AUTH_CHANGE_EVENT } from '../lib/auth';
import { Logo } from './logo';
import { CartIcon, HeartIcon, SearchIcon, UserIcon } from './icons';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const { itemCount, openCart } = useCart();
  const { count: wishlistCount } = useWishlist();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const syncLoggedIn = () => setLoggedIn(Boolean(window.localStorage.getItem('lucia_access_token')));
    syncLoggedIn();
    window.addEventListener(AUTH_CHANGE_EVENT, syncLoggedIn);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, syncLoggedIn);
  }, []);

  return (
    <header className={`sticky top-0 z-50 border-b border-line bg-canvas/95 backdrop-blur-sm transition-shadow ${scrolled ? 'shadow-[0_8px_24px_-20px_rgba(17,17,17,0.45)]' : ''}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/">
          <Logo className="text-xl" />
        </Link>

        <nav aria-label="Principal" className="hidden gap-9 md:flex">
          <Link className="ul text-xs font-semibold uppercase tracking-[0.22em]" href="/shop">Colección</Link>
          <Link className="ul text-xs font-semibold uppercase tracking-[0.22em]" href="/shop">Categorías</Link>
          <Link className="ul text-xs font-semibold uppercase tracking-[0.22em]" href="/nosotros">Nuestra historia</Link>
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            className="flex items-center gap-2 px-2 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted transition-colors hover:text-black"
            href={loggedIn ? '/account' : '/login'}
          >
            <UserIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{loggedIn ? 'Mi cuenta' : 'Ingresar'}</span>
          </Link>

          <Link
            className="hidden p-2 text-muted transition-colors hover:text-black md:inline-flex"
            href="/shop"
            aria-label="Buscar en el catálogo"
          >
            <SearchIcon className="h-5 w-5" />
          </Link>

          <Link
            className="relative p-2 text-muted transition-colors hover:text-black"
            href="/wishlist"
            aria-label={`Ver favoritos (${wishlistCount} productos)`}
          >
            <HeartIcon className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1 text-[10px] font-extrabold leading-none text-white">
                {wishlistCount > 9 ? '9+' : wishlistCount}
              </span>
            )}
          </Link>

          <button
            className="relative p-2 text-muted transition-colors hover:text-black"
            aria-label={`Abrir carrito (${itemCount} items)`}
            onClick={openCart}
            type="button"
          >
            <CartIcon className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="pulse absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1 text-[10px] font-extrabold leading-none text-white">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
