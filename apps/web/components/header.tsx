'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCart } from '../lib/cart';
import { useWishlist } from '../lib/wishlist';
import { AUTH_CHANGE_EVENT } from '../lib/auth';
import { getCategories } from '../lib/api';
import type { CategorySummary } from '../lib/api';
import { Logo } from './logo';
import { CatalogSearch } from './catalog-search';
import { CartIcon, CloseIcon, HeartIcon, MenuIcon, UserIcon } from './icons';

const navLinks = [
  { label: 'Colección completa', href: '/shop' },
  { label: 'Marcas', href: '/marcas' },
  { label: 'Nuestra historia', href: '/nosotros' },
];

const genderLinks = [
  { label: 'Femeninos', value: 'femenino' },
  { label: 'Masculinos', value: 'masculino' },
  { label: 'Unisex', value: 'unisex' },
];

const desktopNavItemClass =
  'desktop-nav-item text-xs font-semibold uppercase tracking-[0.22em] leading-none';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartBump, setCartBump] = useState(false);
  const previousItemCount = useRef(0);
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const [categories, setCategories] = useState<CategorySummary[]>([]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    const syncLoggedIn = () => setLoggedIn(Boolean(window.localStorage.getItem('lucia_access_token')));
    syncLoggedIn();
    window.addEventListener(AUTH_CHANGE_EVENT, syncLoggedIn);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, syncLoggedIn);
  }, []);

  useEffect(() => {
    let active = true;
    void getCategories().then((result) => {
      if (active) setCategories(result);
    }).catch((error: unknown) => {
      console.error('No se pudieron cargar las categorías del menú.', error);
    });
    return () => {
      active = false;
    };
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
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:gap-4 sm:px-6 sm:py-3">
        <Link className="flex min-h-11 shrink-0 items-center" href="/">
          <Logo className="text-[18px] sm:text-[22px]" />
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-9 lg:flex">
          <Link className={desktopNavItemClass} href="/shop">Colección completa</Link>
          <CategoryMenu categories={categories} className={desktopNavItemClass} />
          <Link className={desktopNavItemClass} href="/marcas">Marcas</Link>
          <Link className={desktopNavItemClass} href="/nosotros">Nuestra historia</Link>
        </nav>

        <div className="flex shrink-0 items-center gap-0 sm:gap-1">
          <Link
            aria-label={loggedIn ? 'Mi cuenta' : 'Ingresar'}
            className="hidden min-h-11 items-center gap-2 px-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted transition-colors hover:text-black sm:flex"
            href={loggedIn ? '/account' : '/login'}
          >
            <UserIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{loggedIn ? 'Mi cuenta' : 'Ingresar'}</span>
          </Link>

          <CatalogSearch />

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

          <Link
            className="relative flex h-11 w-11 items-center justify-center text-muted transition-colors hover:text-black"
            aria-label={`Ir al carrito (${itemCount} productos)`}
            href="/cart"
          >
            <CartIcon className="h-5 w-5" />
            {itemCount > 0 && (
              <span className={`${cartBump ? 'bump ' : ''}absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1 text-[10px] font-extrabold leading-none text-white`}>
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>

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
        <nav
          aria-label="Menú móvil"
          className="fixed inset-0 z-[60] flex h-[100dvh] flex-col overflow-y-auto bg-canvas px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(0.75rem+env(safe-area-inset-top))] lg:hidden"
          id="mobile-nav"
        >
          <div className="flex min-h-11 items-center justify-between border-b border-line pb-3">
            <Link className="inline-flex min-h-11 items-center" href="/" onClick={() => setMenuOpen(false)}>
              <Logo className="text-[20px]" />
            </Link>
            <button
              aria-label="Cerrar menú"
              className="flex h-11 w-11 items-center justify-center text-muted"
              onClick={() => setMenuOpen(false)}
              type="button"
            >
              <CloseIcon className="h-6 w-6" />
            </button>
          </div>
          <ul className="mt-5">
            <li>
              <Link
                className="flex min-h-14 items-center border-b border-line text-sm font-semibold uppercase tracking-[0.18em]"
                href="/shop"
                onClick={() => setMenuOpen(false)}
              >
                Colección completa
              </Link>
            </li>
            <li>
              <details className="group border-b border-line">
                <summary className="flex min-h-14 cursor-pointer list-none items-center text-sm font-semibold uppercase tracking-[0.18em] [&::-webkit-details-marker]:hidden">
                  Categorías
                </summary>
                <ul className="mb-3 border-l border-line pl-4">
                  {genderLinks.map((gender) => (
                    <li key={gender.value}>
                      <Link
                        className="flex min-h-12 items-center text-sm uppercase tracking-[0.14em] text-muted"
                        href={`/shop?genero=${gender.value}`}
                        onClick={() => setMenuOpen(false)}
                      >
                        {gender.label}
                      </Link>
                    </li>
                  ))}
                  {categories.map((category) => (
                    <li key={category.id}>
                      <Link
                        className="flex min-h-12 items-center text-sm uppercase tracking-[0.14em] text-muted"
                        href={`/shop?categoria=${encodeURIComponent(category.slug)}`}
                        onClick={() => setMenuOpen(false)}
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
            {navLinks.slice(1).map((link) => (
              <li key={link.label}>
                <Link
                  className="flex min-h-14 items-center border-b border-line text-sm font-semibold uppercase tracking-[0.18em]"
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                className="flex min-h-14 items-center border-b border-line text-sm font-semibold uppercase tracking-[0.18em]"
                href={loggedIn ? '/account' : '/login'}
                onClick={() => setMenuOpen(false)}
              >
                {loggedIn ? 'Mi cuenta' : 'Ingresar'}
              </Link>
            </li>
            <li>
              <Link
                className="flex min-h-14 items-center border-b border-line text-sm font-semibold uppercase tracking-[0.18em]"
                href="/wishlist"
                onClick={() => setMenuOpen(false)}
              >
                Favoritos
              </Link>
            </li>
            {loggedIn && (
              <li>
                <Link
                  className="flex min-h-14 items-center border-b border-line text-sm font-semibold uppercase tracking-[0.18em]"
                  href="/account/orders"
                  onClick={() => setMenuOpen(false)}
                >
                  Mis pedidos
                </Link>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}

function CategoryMenu({ categories, className }: { categories: CategorySummary[]; className: string }) {
  return (
    <details className="group relative">
      <summary className={`${className} cursor-pointer list-none bg-transparent p-0 [&::-webkit-details-marker]:hidden`}>
        Categorías
      </summary>
      <div className="absolute left-0 top-full z-50 mt-2 min-w-56 border border-line bg-white p-4 shadow-lg">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Por género</p>
        <ul>
          {genderLinks.map((gender) => (
            <li key={gender.value}>
              <Link
                className="flex min-h-11 items-center px-3 text-xs uppercase tracking-[0.14em] transition-colors hover:bg-sand"
                href={`/shop?genero=${gender.value}`}
              >
                {gender.label}
              </Link>
            </li>
          ))}
        </ul>
        {categories.length > 0 && (
          <>
            <p className="mt-3 border-t border-line px-3 pb-2 pt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Por categoría</p>
            <ul>
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    className="flex min-h-11 items-center px-3 text-xs uppercase tracking-[0.14em] transition-colors hover:bg-sand"
                    href={`/shop?categoria=${encodeURIComponent(category.slug)}`}
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </details>
  );
}
