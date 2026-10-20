'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { CategorySummary } from '../lib/api';

const GENDER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'femenino', label: 'Femeninos' },
  { value: 'masculino', label: 'Masculinos' },
  { value: 'unisex', label: 'Unisex' },
];

type CatalogFiltersProps = {
  basePath: string;
  current: {
    genero?: string;
    categoria?: string;
    search?: string;
    sort?: string;
  };
  categories?: CategorySummary[];
};

function buildHref(
  basePath: string,
  current: CatalogFiltersProps['current'],
  overrides: Record<string, string | undefined>,
): string {
  const merged = { ...current, ...overrides };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function chipClass(active: boolean): string {
  return `inline-flex min-h-11 items-center border px-4 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
    active ? 'border-black bg-black text-white' : 'border-line hover:border-black hover:bg-sand'
  }`;
}

export function CatalogFilters({ basePath, current, categories = [] }: CatalogFiltersProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const activeCount = (current.genero ? 1 : 0) + (current.categoria ? 1 : 0);

  const genderChips = (
    <div className="flex flex-wrap gap-2">
      {GENDER_OPTIONS.map((option) => (
        <Link
          key={option.value || 'todos'}
          aria-current={current.genero === option.value || (!option.value && !current.genero) ? 'true' : undefined}
          className={chipClass(current.genero === option.value || (!option.value && !current.genero))}
          href={buildHref(basePath, current, { genero: option.value })}
          onClick={() => setOpen(false)}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );

  const categoryChips =
    categories.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        <Link
          className={chipClass(!current.categoria)}
          href={buildHref(basePath, current, { categoria: undefined })}
          onClick={() => setOpen(false)}
        >
          Todas
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            className={chipClass(
              current.categoria === category.slug ||
                current.categoria?.toLowerCase() === category.name.toLowerCase(),
            )}
            href={buildHref(basePath, current, { categoria: category.slug })}
            onClick={() => setOpen(false)}
          >
            {category.name}
            <span className="ml-2 text-[10px] opacity-60">{category.productCount}</span>
          </Link>
        ))}
      </div>
    ) : null;

  return (
    <>
      <div className="hidden flex-wrap items-center gap-x-8 gap-y-4 md:flex">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Género</span>
          {genderChips}
        </div>
        {categoryChips ? (
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Categoría</span>
            {categoryChips}
          </div>
        ) : null}
      </div>

      <button
        aria-expanded={open}
        className="inline-flex min-h-11 items-center gap-2 border border-line px-4 text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:border-black hover:bg-sand md:hidden"
        type="button"
        onClick={() => setOpen(true)}
      >
        Filtros
        {activeCount > 0 ? (
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] text-white">
            {activeCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div aria-label="Filtros" aria-modal="true" className="fixed inset-0 z-50 md:hidden" role="dialog">
          <button
            aria-label="Cerrar filtros"
            className="animate-fade-in absolute inset-0 bg-black/40"
            type="button"
            onClick={() => setOpen(false)}
          />
          <div className="animate-sheet-up absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto border-t border-line bg-white px-6 pb-8 pt-6">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">Filtros</p>
              <button
                aria-label="Cerrar filtros"
                className="inline-flex h-11 w-11 items-center justify-center text-2xl leading-none"
                type="button"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="mt-6 space-y-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Género</p>
                <div className="mt-3">{genderChips}</div>
              </div>
              {categoryChips ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Categoría</p>
                  <div className="mt-3">{categoryChips}</div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
