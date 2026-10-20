'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCart } from '../lib/cart';
import { useWishlist } from '../lib/wishlist';
import { AUTH_CHANGE_EVENT } from '../lib/auth';
import { Logo } from './logo';
import { CartIcon, CloseIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from './icons';

const navLinks = [
  { label: 'Colección completa', href: '/shop' },
  { label: 'Categorías', href: '/shop' },
  { label: 'Nuestra historia', href: '/nosotros' },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartBump, setCartBump] = useState(false);
  const previousItemCount = useRef(0);
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

  useEffect(() => {
    if (previousItemCount.current === itemCount) return;
    previousItemCount.current = itemCount;
    if (itemCount <= 0) return;
    setCartBump(true);
    const timer = window.setTimeout(() => setCartBump(false), 260);
    return () => window.clearTimeout(timer);
  }, [itemCount]);

  return (
    <header className={`sticky top-0 z-50 border-b border-line bg-canvas/95 backdrop-blur-sm transition-shadow ${scrolled ? 'shadow-[0_8px_24px_-20px_rgba(17,17,17,0.45)]' : ''}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <Link className="flex min-h-11 items-center" href="/">
          <Logo className="text-[22px]" />
        </Link>

        <nav aria-label="Principal" className="hidden gap-9 lg:flex">
          {navLinks.map((link) => (
            <Link className="ul text-xs font-semibold uppercase tracking-[0.22em]" href={link.href} key={link.label}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <Link
            aria-label={loggedIn ? 'Mi cuenta' : 'Ingresar'}
            className="flex min-h-11 items-center gap-2 px-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted transition-colors hover:text-black"
            href={loggedIn ? '/account' : '/login'}
          >
            <UserIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{loggedIn ? 'Mi cuenta' : 'Ingresar'}</span>
          </Link>

          <Link
            className="hidden h-11 w-11 items-center justify-center text-muted transition-colors hover:text-black md:inline-flex"
            href="/shop"
            aria-label="Buscar en el catálogo"
          >
            <SearchIcon className="h-5 w-5" />
          </Link>

          <Link
            className="relative flex h-11 w-11 items-center justify-center text-muted transition-colors hover:text-black"
            href="/wishlist"
            aria-label={`Ver favoritos (${wishlistCount} productos)`}
          >
            <HeartIcon className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1 text-[10px] font-extrabold leading-none text-white">
                {wishlistCount > 9 ? '9+' : wishlistCount}
              </span>
            )}
          </Link>

          <button
            className="relative flex h-11 w-11 items-center justify-center text-muted transition-colors hover:text-black"
            aria-label={`Abrir carrito (${itemCount} items)`}
            onClick={openCart}
            type="button"
          >
            <CartIcon className="h-5 w-5" />
            {itemCount > 0 && (
              <span className={`${cartBump ? 'bump ' : ''}absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1 text-[10px] font-extrabold leading-none text-white`}>
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </button>

          <button
            className="flex h-11 w-11 items-center justify-center text-muted transition-colors hover:text-black lg:hidden"
            aria-controls="mobile-nav"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            {menuOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav aria-label="Menú móvil" className="border-t border-line bg-canvas px-6 pb-4 pt-2 lg:hidden" id="mobile-nav">
          <ul>
            {navLinks.map((link) => (
              <li key={link.label}>
                <Link
                  className="flex min-h-11 items-center text-xs font-semibold uppercase tracking-[0.22em]"
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                className="flex min-h-11 items-center text-xs font-semibold uppercase tracking-[0.22em]"
                href="/shop"
                onClick={() => setMenuOpen(false)}
              >
                Buscar en el catálogo
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
