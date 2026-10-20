'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  getAdminHero,
  listAdminProducts,
  reorderFeaturedProducts,
  revalidateHome,
  updateAdminHero,
  updateAdminProduct,
  uploadImage,
} from '../../../lib/admin';
import type { AdminHero, AdminProduct } from '../../../lib/admin';
import { resolveImageUrl } from '../../../lib/api';
import { Logo } from '../../../components/logo';
import { SmartImage } from '../../../components/smart-image';

const heroTextDefaults = {
  title: 'Una esencia para cada versión de vos.',
  subtitle: 'Fragancias y cosmética seleccionadas para acompañar tus rituales cotidianos.',
  buttonLabel: 'Explorar colección',
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

export default function AdminHomePage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [hero, setHero] = useState<AdminHero | null>(null);
  const [heroProductId, setHeroProductId] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [heroButtonLabel, setHeroButtonLabel] = useState('');
  const [uploading, setUploading] = useState(false);
  const [savingHero, setSavingHero] = useState(false);
  const [pendingId, setPendingId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      const [productList, heroConfig] = await Promise.all([listAdminProducts(), getAdminHero()]);
      setProducts(productList);
      setHero(heroConfig);
      setHeroProductId(heroConfig.productId ?? '');
      setHeroImageUrl(heroConfig.imageUrl ?? '');
      setHeroTitle(heroConfig.title ?? '');
      setHeroSubtitle(heroConfig.subtitle ?? '');
      setHeroButtonLabel(heroConfig.buttonLabel ?? '');
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const featured = products
    .filter((product) => product.featured)
    .sort((a, b) => a.featuredOrder - b.featuredOrder);
  const available = products
    .filter((product) => !product.featured)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const heroCandidates = products.filter((product) => product.isActive);
  const selectedHeroProduct = products.find((product) => product.id === heroProductId) ?? null;
  const heroImagePreview = resolveImageUrl(heroImageUrl) ?? resolveImageUrl(selectedHeroProduct?.imageUrl);

  async function saveHero(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSavingHero(true);
    try {
      const updated = await updateAdminHero({
        productId: heroProductId || null,
        imageUrl: heroImageUrl || null,
        title: heroTitle || null,
        subtitle: heroSubtitle || null,
        buttonLabel: heroButtonLabel || null,
      });
      setHero(updated);
      setMessage('Portada guardada. El inicio ya muestra los cambios.');
      await revalidateHome();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSavingHero(false);
    }
  }

  async function handleHeroUpload(file?: File) {
    if (!file) return;
    setError('');
    setMessage('');
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setHeroImageUrl(url);
      setMessage('Imagen subida. Guardá los cambios para aplicarla.');
    } catch (uploadError) {
      setError(getErrorMessage(uploadError));
    } finally {
      setUploading(false);
    }
  }

  async function toggleFeatured(product: AdminProduct) {
    setError('');
    setMessage('');
    setPendingId(product.id);
    try {
      await updateAdminProduct(product.id, { featured: !product.featured });
      setMessage(
        product.featured
          ? `"${product.name}" salió de Favoritos.`
          : `"${product.name}" se agregó a Favoritos.`,
      );
      await load();
      await revalidateHome();
    } catch (toggleError) {
      setError(getErrorMessage(toggleError));
    } finally {
      setPendingId('');
    }
  }

  async function moveFeatured(product: AdminProduct, direction: -1 | 1) {
    const currentIds = featured.map((item) => item.id);
    const index = currentIds.indexOf(product.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= currentIds.length) return;
    const nextIds = [...currentIds];
    nextIds[index] = currentIds[target];
    nextIds[target] = currentIds[index];
    setError('');
    setMessage('');
    setPendingId(product.id);
    try {
      await reorderFeaturedProducts(nextIds);
      await load();
      await revalidateHome();
    } catch (moveError) {
      setError(getErrorMessage(moveError));
    } finally {
      setPendingId('');
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex items-center justify-between">
        <a className="font-display text-xl" href="/admin" aria-label="Panel admin"><Logo className="text-xl" /></a>
        <a className="ul text-xs font-semibold uppercase tracking-[0.22em]" href="/shop">Tienda</a>
      </div>
      <a className="mt-10 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.22em] text-muted transition-colors hover:text-black" href="/admin"><span aria-hidden="true">←</span>Volver al panel</a>
      <h1 className="mt-5 font-display text-6xl font-black uppercase tracking-[-0.02em]">Portada</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        Elegí el producto que protagoniza el inicio y los destacados de la sección Favoritos. Si no configurás nada, se muestran los productos más recientes.
      </p>

      {message && <p className="mt-6 border border-line bg-white px-4 py-3 text-sm" role="status">{message}</p>}
      {error && <p className="mt-6 border border-red-700/30 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}

      <form className="mt-12 border border-line bg-white p-6" onSubmit={saveHero}>
        <h2 className="font-display text-3xl font-black uppercase tracking-[-0.02em]">Hero del inicio</h2>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <label className="label-xs block text-muted">
              Producto destacado
              <select
                className="input-line mt-2 text-sm normal-case tracking-normal text-ink"
                value={heroProductId}
                onChange={(event) => setHeroProductId(event.target.value)}
              >
                <option value="">— Sin producto —</option>
                {heroCandidates.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} · {product.brand}
                  </option>
                ))}
              </select>
            </label>

            <label className="label-xs block text-muted">
              Imagen propia (opcional)
              <input
                className="input-line mt-2 text-sm normal-case tracking-normal text-ink"
                placeholder="https://… o /uploads/…"
                value={heroImageUrl}
                onChange={(event) => setHeroImageUrl(event.target.value)}
              />
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <label className="btn-ghost cursor-pointer">
                {uploading ? 'Subiendo…' : 'Subir imagen'}
                <input
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(event) => void handleHeroUpload(event.target.files?.[0])}
                  type="file"
                />
              </label>
              {heroImageUrl && (
                <button
                  className="ul text-xs font-semibold uppercase tracking-[0.22em] text-muted hover:text-black"
                  onClick={() => setHeroImageUrl('')}
                  type="button"
                >
                  Quitar imagen propia
                </button>
              )}
            </div>

            <label className="label-xs block text-muted">
              Título
              <input
                className="input-line mt-2 text-sm normal-case tracking-normal text-ink"
                maxLength={120}
                placeholder={heroTextDefaults.title}
                value={heroTitle}
                onChange={(event) => setHeroTitle(event.target.value)}
              />
            </label>

            <label className="label-xs block text-muted">
              Subtítulo
              <textarea
                className="input-line mt-2 text-sm normal-case tracking-normal text-ink"
                maxLength={300}
                placeholder={heroTextDefaults.subtitle}
                rows={3}
                value={heroSubtitle}
                onChange={(event) => setHeroSubtitle(event.target.value)}
              />
            </label>

            <label className="label-xs block text-muted">
              Texto del botón
              <input
                className="input-line mt-2 text-sm normal-case tracking-normal text-ink"
                maxLength={40}
                placeholder={heroTextDefaults.buttonLabel}
                value={heroButtonLabel}
                onChange={(event) => setHeroButtonLabel(event.target.value)}
              />
            </label>

            <button
              className="btn-primary"
              disabled={savingHero}
              type="submit"
            >
              {savingHero ? 'Guardando…' : 'Guardar portada'}
            </button>
          </div>

          <div>
            <p className="label-xs text-muted">Vista previa</p>
            <div className="relative mt-2 flex aspect-[4/5] items-end justify-center overflow-hidden border border-line bg-sand p-8">
              {heroImagePreview ? (
                <SmartImage alt="" className="object-cover" sizes="(min-width: 1024px) 480px, 100vw" src={heroImagePreview} />
              ) : !selectedHeroProduct ? (
                <div className="w-32 border border-black/20 bg-white/70 px-4 py-8 text-center shadow-xl">
                  <p className="font-display text-3xl font-black tracking-[0.12em]">L</p>
                  <p className="mt-2 text-[9px] uppercase tracking-[0.24em]">Lucía</p>
                </div>
              ) : null}
              {selectedHeroProduct && (
                <div className="relative z-10 w-full border border-line bg-white/95 px-4 py-3">
                  <p className="font-display text-xl font-black uppercase leading-none">{selectedHeroProduct.name}</p>
                  <div className="mt-2 flex items-center justify-between gap-4 text-[10px] uppercase tracking-[0.14em] text-muted">
                    <span>{selectedHeroProduct.brand}</span>
                    <span className="font-bold text-ink">
                      {Number(selectedHeroProduct.price).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">
              {hero?.product
                ? `Hoy el inicio muestra "${hero.product.name}" de ${hero.product.brand}.`
                : 'Hoy el inicio muestra la portada genérica de Lucía.'}
            </p>
          </div>
        </div>
      </form>

      <section className="mt-12 border border-line bg-white p-6">
        <h2 className="font-display text-3xl font-black uppercase tracking-[-0.02em]">Favoritos del inicio</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Los productos destacados aparecen en la sección Favoritos, en este orden. Podés destacar hasta 6; sin destacados se muestran los últimos productos publicados.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="label-xs text-muted">Destacados ({featured.length})</h3>
            {featured.length === 0 ? (
              <p className="mt-4 border border-dashed border-line px-4 py-6 text-sm text-muted">
                Todavía no hay productos destacados.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {featured.map((product, index) => {
                  const warn = !product.isActive || product.stock <= 0;
                  return (
                    <li className="flex items-center gap-3 border border-line p-3" key={product.id}>
                      <span className="w-6 text-center text-xs font-bold text-muted">{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{product.name}</p>
                        <p className="truncate text-xs text-muted">{product.brand}</p>
                        {warn && (
                          <p className="mt-1 text-xs font-semibold text-red-700">
                            {product.isActive ? 'Sin stock: no se muestra en el inicio.' : 'Inactivo: no se muestra en el inicio.'}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          aria-label={`Subir ${product.name}`}
                          className="border border-line px-3 py-2 text-xs transition-colors hover:bg-sand disabled:opacity-30"
                          disabled={index === 0 || pendingId === product.id}
                          onClick={() => void moveFeatured(product, -1)}
                          type="button"
                        >
                          ↑
                        </button>
                        <button
                          aria-label={`Bajar ${product.name}`}
                          className="border border-line px-3 py-2 text-xs transition-colors hover:bg-sand disabled:opacity-30"
                          disabled={index === featured.length - 1 || pendingId === product.id}
                          onClick={() => void moveFeatured(product, 1)}
                          type="button"
                        >
                          ↓
                        </button>
                        <button
                          className="border border-line px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] transition-colors hover:border-red-700/30 hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
                          disabled={pendingId === product.id}
                          onClick={() => void toggleFeatured(product)}
                          type="button"
                        >
                          Quitar
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div>
            <h3 className="label-xs text-muted">Productos del catálogo</h3>
            {available.length === 0 ? (
              <p className="mt-4 border border-dashed border-line px-4 py-6 text-sm text-muted">
                No hay más productos para destacar.
              </p>
            ) : (
              <ul className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                {available.map((product) => {
                  const blocked = !product.isActive || product.stock <= 0;
                  return (
                    <li className="flex items-center gap-3 border border-line p-3" key={product.id}>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{product.name}</p>
                        <p className="truncate text-xs text-muted">{product.brand}</p>
                        {blocked && (
                          <p className="mt-1 text-xs text-muted">
                            {product.isActive ? 'Sin stock: no se puede destacar.' : 'Inactivo: no se puede destacar.'}
                          </p>
                        )}
                      </div>
                      <button
                        className="btn-ghost"
                        disabled={blocked || pendingId === product.id}
                        onClick={() => void toggleFeatured(product)}
                        type="button"
                      >
                        Destacar
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
