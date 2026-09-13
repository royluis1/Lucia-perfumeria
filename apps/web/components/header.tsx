'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '../lib/cart';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const { itemCount, openCart } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setLoggedIn(Boolean(window.localStorage.getItem('lucia_access_token')));
  }, []);

  return (
    <header className={`border-b border-black/10 bg-canvas/95 backdrop-blur-sm sticky top-0 z-50 transition-shadow ${scrolled ? 'shadow-sm' : ''}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link className="font-display text-xl font-bold tracking-[0.18em]" href="/">
          LUCÍA
        </Link>

        <nav className="hidden gap-8 text-xs uppercase tracking-[0.16em] md:flex">
          <Link className="hover:text-gold transition-colors" href="/shop">Colección</Link>
          <Link className="hover:text-gold transition-colors" href="/shop">Categorías</Link>
          <Link className="hover:text-gold transition-colors" href="#historia">Nuestra historia</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            className="flex items-center gap-1.5 text-xs uppercase tracking-[0.12em] hover:text-gold transition-colors"
            href={loggedIn ? '/account' : '/login'}
          >
            <UserIcon className="h-4 w-4" />
            {loggedIn ? 'Mi cuenta' : 'Ingresar'}
          </Link>

          <button
            className="p-2 text-black/60 hover:text-gold transition-colors md:hidden"
            aria-label="Buscar"
          >
            <SearchIcon className="h-5 w-5" />
          </button>

          <button
            className="relative p-2 text-black/60 hover:text-gold transition-colors"
            aria-label={`Abrir carrito (${itemCount} items)`}
            onClick={openCart}
          >
            <CartIcon className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center text-[10px] font-bold text-white bg-gold rounded-full">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

function CartIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function UserIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function SearchIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}