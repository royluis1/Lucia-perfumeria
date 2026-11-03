'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draftGender, setDraftGender] = useState(current.genero ?? '');
  const [draftCategory, setDraftCategory] = useState(current.categoria ?? '');

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const activeCount = (current.genero ? 1 : 0) + (current.categoria ? 1 : 0);

  function showFilters() {
    setDraftGender(current.genero ?? '');
    setDraftCategory(current.categoria ?? '');
    setOpen(true);
  }

  function applyFilters() {
    router.push(buildHref(basePath, current, {
      genero: draftGender || undefined,
      categoria: draftCategory || undefined,
    }));
    setOpen(false);
  }

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
        onClick={showFilters}
      >
        Filtros
        {activeCount > 0 ? (
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] text-white">
            {activeCount}
          </span>
        ) : null}
      </button>

      {activeCount > 0 && (
        <div aria-label="Filtros activos" className="mt-3 flex flex-wrap gap-2 md:hidden">
          {current.genero && (
            <Link
              className="inline-flex min-h-10 items-center gap-2 border border-black bg-black px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white"
              href={buildHref(basePath, current, { genero: undefined })}
            >
              {GENDER_OPTIONS.find((option) => option.value === current.genero)?.label ?? current.genero}
              <span aria-hidden="true">×</span>
            </Link>
          )}
          {current.categoria && (
            <Link
              className="inline-flex min-h-10 items-center gap-2 border border-black bg-black px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white"
              href={buildHref(basePath, current, { categoria: undefined })}
            >
              {categories.find((category) => category.slug === current.categoria)?.name ?? current.categoria}
              <span aria-hidden="true">×</span>
            </Link>
          )}
        </div>
      )}

      {open ? (
        <div aria-label="Filtros" aria-modal="true" className="fixed inset-0 z-50 md:hidden" role="dialog">
          <button
            aria-label="Cerrar filtros"
            className="animate-fade-in absolute inset-0 bg-black/40"
            type="button"
            onClick={() => setOpen(false)}
          />
          <div className="animate-sheet-up absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto border-t border-line bg-white px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-5">
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
                <div className="mt-3 flex flex-wrap gap-2">
                  {GENDER_OPTIONS.map((option) => {
                    const selected = draftGender === option.value;
                    return (
                      <button
                        aria-pressed={selected}
                        className={chipClass(selected)}
                        key={option.value || 'todos'}
                        onClick={() => setDraftGender(option.value)}
                        type="button"
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {categoryChips ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Categoría</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      aria-pressed={!draftCategory}
                      className={chipClass(!draftCategory)}
                      onClick={() => setDraftCategory('')}
                      type="button"
                    >
                      Todas
                    </button>
                    {categories.map((category) => {
                      const selected = draftCategory === category.slug ||
                        draftCategory.toLowerCase() === category.name.toLowerCase();
                      return (
                        <button
                          aria-pressed={selected}
                          className={chipClass(selected)}
                          key={category.id}
                          onClick={() => setDraftCategory(category.slug)}
                          type="button"
                        >
                          {category.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="sticky bottom-0 mt-6 flex gap-3 border-t border-line bg-white pt-4">
              <button
                className="btn-ghost flex-1"
                onClick={() => {
                  setDraftGender('');
                  setDraftCategory('');
                }}
                type="button"
              >
                Limpiar
              </button>
              <button className="btn-primary flex-1" onClick={applyFilters} type="button">
                Aplicar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
