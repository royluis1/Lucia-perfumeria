'use client';

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { getProducts } from '../lib/api';
import type { ProductSummary } from '../lib/api';
import { CloseIcon, SearchIcon } from './icons';

const SUGGESTION_LIMIT = 6;

export function CatalogSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductSummary[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateViewport = () => setMobile(mediaQuery.matches);
    updateViewport();
    mediaQuery.addEventListener('change', updateViewport);
    return () => mediaQuery.removeEventListener('change', updateViewport);
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    if (!mobile) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open, mobile]);

  useEffect(() => {
    const term = query.trim();
    setActiveIndex(-1);
    setError('');
    setHasSearched(false);
    if (!open || term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ search: term, limit: String(SUGGESTION_LIMIT) });
      void getProducts(params, controller.signal)
        .then((response) => {
          setResults(response.data);
          setHasSearched(true);
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setError('No pudimos cargar las sugerencias. Probá de nuevo.');
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, query]);

  function closeSearch() {
    setOpen(false);
    setActiveIndex(-1);
    triggerRef.current?.focus();
  }

  function goToSearch(event?: FormEvent) {
    event?.preventDefault();
    const term = query.trim();
    if (!term) return;
    setOpen(false);
    router.push(`/shop?search=${encodeURIComponent(term)}`);
  }

  function selectProduct(product: ProductSummary) {
    setOpen(false);
    router.push(`/shop/${encodeURIComponent(product.slug)}`);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeSearch();
      return;
    }
    if (!results.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      selectProduct(results[activeIndex]);
    }
  }

  const panel = open && (
    <section
      aria-label="Buscar productos"
      aria-modal={mobile}
      className={mobile
        ? 'fixed inset-0 z-[70] flex h-dvh min-h-dvh flex-col bg-canvas p-5'
        : 'absolute right-0 top-full z-[70] mt-2 w-[min(90vw,28rem)] border border-line bg-canvas p-4 shadow-xl'}
      id="catalog-search-panel"
      role="dialog"
    >
      {mobile && (
        <div className="mb-5 flex min-h-11 items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.18em]">Buscar productos</span>
          <button
            aria-label="Cerrar búsqueda"
            className="flex h-11 w-11 items-center justify-center text-muted"
            onClick={closeSearch}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>
      )}
      <form className="flex items-center gap-2 border-b border-ink" onSubmit={goToSearch} role="search">
        <label className="sr-only" htmlFor="catalog-search-input">Buscar productos</label>
        <input
          ref={inputRef}
          aria-activedescendant={activeIndex >= 0 ? `catalog-search-option-${activeIndex}` : undefined}
          aria-autocomplete="list"
          aria-controls="catalog-search-options"
          aria-expanded={results.length > 0}
          autoComplete="off"
          className="min-h-12 min-w-0 flex-1 bg-transparent px-1 text-base outline-none"
          id="catalog-search-input"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nombre, marca o categoría"
          role="combobox"
          value={query}
        />
        <button
          aria-label="Ver todos los resultados"
          className="flex h-11 min-w-11 items-center justify-center text-muted hover:text-ink"
          type="submit"
        >
          <SearchIcon />
        </button>
      </form>

      <div className={mobile ? 'mt-5 flex-1 overflow-y-auto' : 'max-h-80 overflow-y-auto'}>
        {loading && <p className="py-4 text-sm text-muted" role="status">Buscando...</p>}
        {error && <p className="py-4 text-sm text-red-700" role="alert">{error}</p>}
        {!loading && !error && hasSearched && results.length === 0 && (
          <p className="py-4 text-sm text-muted">No encontramos productos para esa búsqueda.</p>
        )}
        {results.length > 0 && (
          <ul aria-label="Sugerencias" className="divide-y divide-line" id="catalog-search-options" role="listbox">
            {results.map((product, index) => (
              <li key={product.id}>
                <button
                  aria-selected={activeIndex === index}
                  className={`flex min-h-14 w-full items-center justify-between gap-4 px-2 text-left ${
                    activeIndex === index ? 'bg-sand' : 'hover:bg-sand/60'
                  }`}
                  id={`catalog-search-option-${index}`}
                  onClick={() => selectProduct(product)}
                  onMouseEnter={() => setActiveIndex(index)}
                  role="option"
                  type="button"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{product.name}</span>
                    <span className="block truncate text-xs text-muted">{product.brand}</span>
                  </span>
                  <span aria-hidden="true" className="text-muted">↗</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        aria-label={open ? 'Cerrar búsqueda' : 'Buscar en el catálogo'}
        aria-hidden={open || undefined}
        aria-controls="catalog-search-panel"
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center text-muted transition-colors hover:text-black"
        onClick={() => {
          if (open) {
            closeSearch();
          } else {
            setMobile(window.matchMedia('(max-width: 767px)').matches);
            setOpen(true);
          }
        }}
        tabIndex={open ? -1 : 0}
        type="button"
      >
        {open ? <CloseIcon className="h-5 w-5" /> : <SearchIcon className="h-5 w-5" />}
      </button>

      {panel && (mobile ? (portalReady ? createPortal(panel, document.body) : null) : panel)}
    </div>
  );
}
