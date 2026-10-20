'use client';

import { FormEvent, KeyboardEvent, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  listAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deactivateAdminProduct,
  listAdminBrands,
  listAdminCategories,
  updateAdminBrand,
  mergeAdminBrand,
  uploadImage,
  revalidateHome,
} from '../../../lib/admin';
import type {
  AdminBrand,
  AdminCategory,
  AdminProduct,
  AdminProductGender,
  AdminProductImage,
} from '../../../lib/admin';
import { resolveImageUrl } from '../../../lib/api';
import { Logo } from '../../../components/logo';
import { SmartImage } from '../../../components/smart-image';

const ProductImagesManager = dynamic(
  () => import('../../../components/admin/product-images').then((mod) => mod.ProductImagesManager),
  { ssr: false, loading: () => <p className="text-xs text-muted">Cargando gestor de fotos…</p> },
);

const GENDER_LABELS: Record<AdminProductGender, string> = {
  FEMENINO: 'Femenino',
  MASCULINO: 'Masculino',
  UNISEX: 'Unisex',
};

const GENDER_OPTIONS = (Object.keys(GENDER_LABELS) as AdminProductGender[]).map((value) => ({
  value,
  label: GENDER_LABELS[value],
}));

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const emptyForm = {
  slug: '',
  name: '',
  brand: '',
  brandId: '',
  description: '',
  price: '',
  stock: '',
  sku: '',
  weightGrams: '',
  gender: '',
  categoryId1: '',
  categoryId2: '',
  imageUrl: '',
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [brandOpen, setBrandOpen] = useState(false);
  const [brandActive, setBrandActive] = useState(-1);
  const [brandNames, setBrandNames] = useState<Record<string, string>>({});
  const [mergeTargets, setMergeTargets] = useState<Record<string, string>>({});
  const [busyBrand, setBusyBrand] = useState<string | null>(null);

  async function loadProducts() {
    try {
      const data = await listAdminProducts();
      setProducts(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el catálogo.');
      setProducts([]);
    }
  }

  async function loadCatalogs() {
    try {
      const [brandList, categoryList] = await Promise.all([listAdminBrands(), listAdminCategories()]);
      setBrands(brandList);
      setCategories(categoryList);
      setForm((previous) =>
        !previous.categoryId1 && categoryList[0]
          ? { ...previous, categoryId1: categoryList[0].id }
          : previous,
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar marcas y categorías.');
    }
  }

  useEffect(() => {
    void loadProducts();
    void loadCatalogs();
  }, []);

  function setField(field: keyof typeof form, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function startEdit(product: AdminProduct) {
    setEditingId(product.id);
    setError('');
    setMessage('');
    setBrandOpen(false);
    setForm({
      slug: product.slug,
      name: product.name,
      brand: product.brandRef?.name ?? product.brand,
      brandId: product.brandRef?.id ?? '',
      description: product.description,
      price: String(Number(product.price)),
      stock: String(product.stock),
      sku: product.sku,
      weightGrams: String(product.weightGrams),
      gender: product.gender ?? '',
      categoryId1: product.categories[0]?.category.id ?? '',
      categoryId2: product.categories[1]?.category.id ?? '',
      imageUrl: product.imageUrl ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setBrandOpen(false);
    setBrandActive(-1);
    setForm((previous) => ({
      ...emptyForm,
      categoryId1: categories[0]?.id ?? previous.categoryId1,
    }));
  }

  const editingProduct = products.find((product) => product.id === editingId) ?? null;

  const brandSuggestions = brands
    .filter((brand) => !form.brand.trim() || normalize(brand.name).includes(normalize(form.brand)))
    .slice(0, 8);
  const brandHasExactMatch = brands.some((brand) => normalize(brand.name) === normalize(form.brand));

  function pickBrand(brand: AdminBrand) {
    setForm((previous) => ({ ...previous, brand: brand.name, brandId: brand.id }));
    setBrandOpen(false);
    setBrandActive(-1);
  }

  function handleBrandKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setBrandOpen(false);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!brandOpen) {
        setBrandOpen(true);
        setBrandActive(0);
        return;
      }
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setBrandActive((current) => {
        const next = current + direction;
        if (next < 0) return brandSuggestions.length - 1;
        if (next >= brandSuggestions.length) return 0;
        return next;
      });
      return;
    }
    if (event.key === 'Enter' && brandOpen && brandActive >= 0) {
      event.preventDefault();
      const suggestion = brandSuggestions[brandActive];
      if (suggestion) pickBrand(suggestion);
    }
  }

  function handleImagesChanged(nextImages: AdminProductImage[]) {
    if (!editingId) return;
    setProducts((previous) =>
      previous.map((product) =>
        product.id === editingId
          ? { ...product, images: nextImages, imageUrl: nextImages[0]?.url ?? null }
          : product,
      ),
    );
    void revalidateHome();
  }

  async function handleImageUpload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const url = await uploadImage(file);
      setField('imageUrl', url);
      setMessage('Imagen subida. Guardá el producto para aplicarla.');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!editingId && !form.gender) {
      setError('Elegí el género del producto.');
      return;
    }
    const categoryIds = [...new Set([form.categoryId1, form.categoryId2].filter(Boolean))];
    if (categoryIds.length === 0) {
      setError('Elegí al menos una categoría.');
      return;
    }
    const payload = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      brand: form.brand.trim(),
      ...(form.brandId ? { brandId: form.brandId } : {}),
      description: form.description.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      sku: form.sku.trim(),
      weightGrams: Number(form.weightGrams),
      ...(form.gender ? { gender: form.gender } : {}),
      categoryIds,
      ...(form.imageUrl && !editingId ? { imageUrl: form.imageUrl } : {}),
    };
    try {
      if (editingId) {
        await updateAdminProduct(editingId, payload);
        setMessage('Producto actualizado.');
      } else {
        await createAdminProduct(payload);
        setMessage('Producto creado.');
      }
      resetForm();
      await Promise.all([loadProducts(), loadCatalogs()]);
      await revalidateHome();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo guardar el producto');
    }
  }

  async function handleToggle(product: AdminProduct) {
    try {
      await updateAdminProduct(product.id, { isActive: !product.isActive });
      await loadProducts();
      await revalidateHome();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'No se pudo actualizar el estado');
    }
  }

  async function handleDelete(product: AdminProduct) {
    if (!window.confirm(`¿Desactivar "${product.name}"? No se elimina del historial de pedidos.`)) return;
    try {
      await deactivateAdminProduct(product.id);
      await loadProducts();
      await revalidateHome();
      setMessage('Producto desactivado.');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo desactivar el producto');
    }
  }

  async function handleRenameBrand(brand: AdminBrand) {
    const name = (brandNames[brand.id] ?? brand.name).trim();
    if (!name || name === brand.name) return;
    setError('');
    setMessage('');
    setBusyBrand(brand.id);
    try {
      await updateAdminBrand(brand.id, name);
      setBrandNames((previous) => {
        const next = { ...previous };
        delete next[brand.id];
        return next;
      });
      await Promise.all([loadProducts(), loadCatalogs()]);
      await revalidateHome();
      setMessage(`Marca "${name}" actualizada.`);
    } catch (renameError) {
      setError(renameError instanceof Error ? renameError.message : 'No se pudo renombrar la marca');
    } finally {
      setBusyBrand(null);
    }
  }

  async function handleMergeBrand(brand: AdminBrand) {
    const targetId = mergeTargets[brand.id];
    if (!targetId) return;
    const target = brands.find((item) => item.id === targetId);
    if (!window.confirm(
      `¿Fusionar "${brand.name}" dentro de "${target?.name ?? 'la marca elegida'}"? ` +
      `Los productos pasan a la marca destino y "${brand.name}" se elimina.`,
    )) {
      return;
    }
    setError('');
    setMessage('');
    setBusyBrand(brand.id);
    try {
      const result = await mergeAdminBrand(brand.id, targetId);
      setMergeTargets((previous) => {
        const next = { ...previous };
        delete next[brand.id];
        return next;
      });
      resetForm();
      await Promise.all([loadProducts(), loadCatalogs()]);
      await revalidateHome();
      setMessage(`"${brand.name}" se fusionó con "${target?.name ?? 'la marca destino'}" (${result.productsMoved} productos).`);
    } catch (mergeError) {
      setError(mergeError instanceof Error ? mergeError.message : 'No se pudieron fusionar las marcas');
    } finally {
      setBusyBrand(null);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <div className="flex items-center justify-between">
        <a className="font-display text-xl" href="/admin" aria-label="Panel admin"><Logo className="text-xl" /></a>
        <a className="ul text-xs font-semibold uppercase tracking-[0.22em]" href="/shop">Tienda</a>
      </div>
      <a className="mt-10 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.22em] text-muted transition-colors hover:text-black" href="/admin"><span aria-hidden="true">←</span>Volver al panel</a>
      <h1 className="mt-5 font-display text-6xl font-black uppercase tracking-[-0.02em]">Productos</h1>
      {message && <p className="mt-6 border border-line bg-white px-4 py-3 text-sm" role="status">{message}</p>}
      {error && <p className="mt-6 border border-red-700/30 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}

      <form className="mt-10 grid gap-6 border border-line bg-white p-6 md:grid-cols-3" onSubmit={handleSubmit}>
        <label className="label-xs block text-muted">Nombre<input className="input-line mt-2 text-sm normal-case tracking-normal text-ink" required value={form.name} onChange={(event) => setField('name', event.target.value)} /></label>
        <div className="relative">
          <label className="label-xs block text-muted">Marca
            <input
              aria-autocomplete="list"
              aria-controls="brand-suggestions"
              aria-expanded={brandOpen}
              autoComplete="off"
              className="input-line mt-2 text-sm normal-case tracking-normal text-ink"
              required
              role="combobox"
              value={form.brand}
              onBlur={() => window.setTimeout(() => setBrandOpen(false), 150)}
              onChange={(event) => {
                setField('brand', event.target.value);
                setField('brandId', '');
                setBrandOpen(true);
              }}
              onFocus={() => setBrandOpen(true)}
              onKeyDown={handleBrandKeyDown}
            />
          </label>
          {brandOpen && (brandSuggestions.length > 0 || (form.brand.trim() && !brandHasExactMatch)) ? (
            <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto border border-line bg-white shadow-lg" id="brand-suggestions" role="listbox">
              {brandSuggestions.map((brand, index) => (
                <li key={brand.id} role="option" aria-selected={index === brandActive}>
                  <button
                    className={`block w-full px-4 py-2.5 text-left text-sm transition-colors ${index === brandActive ? 'bg-sand' : ''}`}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      pickBrand(brand);
                    }}
                    onMouseEnter={() => setBrandActive(index)}
                  >
                    {brand.name}
                    <span className="ml-2 text-xs text-muted">{brand.productCount}</span>
                  </button>
                </li>
              ))}
              {form.brand.trim() && !brandHasExactMatch ? (
                <li className="border-t border-line px-4 py-2.5 text-xs text-muted">
                  Se creará la marca «{form.brand.trim()}» al guardar.
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>
        <label className="label-xs block text-muted">Slug<input className="input-line mt-2 text-sm normal-case tracking-normal text-ink" required value={form.slug} onChange={(event) => setField('slug', event.target.value)} placeholder="ej: mi-perfume" /></label>
        <label className="label-xs block text-muted md:col-span-2">Descripción<textarea className="input-line mt-2 text-sm normal-case tracking-normal text-ink" required rows={2} value={form.description} onChange={(event) => setField('description', event.target.value)} /></label>
        <label className="label-xs block text-muted">Género
          <select
            className="input-line mt-2 text-sm normal-case tracking-normal text-ink"
            required={!editingId}
            value={form.gender}
            onChange={(event) => setField('gender', event.target.value)}
          >
            <option value="">{editingId ? 'Sin clasificar' : 'Elegí género'}</option>
            {GENDER_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="label-xs block text-muted">Categoría principal
          <select className="input-line mt-2 text-sm normal-case tracking-normal text-ink" required value={form.categoryId1} onChange={(event) => setField('categoryId1', event.target.value)}>
            <option value="">Elegí categoría</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <label className="label-xs block text-muted">Categoría secundaria (opcional)
          <select className="input-line mt-2 text-sm normal-case tracking-normal text-ink" value={form.categoryId2} onChange={(event) => setField('categoryId2', event.target.value)}>
            <option value="">Ninguna</option>
            {categories.filter((category) => category.id !== form.categoryId1).map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <label className="label-xs block text-muted">Precio (ARS)<input className="input-line mt-2 text-sm normal-case tracking-normal text-ink" min="0.01" required step="0.01" type="number" value={form.price} onChange={(event) => setField('price', event.target.value)} /></label>
        <label className="label-xs block text-muted">Stock<input className="input-line mt-2 text-sm normal-case tracking-normal text-ink" min="0" required type="number" value={form.stock} onChange={(event) => setField('stock', event.target.value)} /></label>
        <label className="label-xs block text-muted">SKU<input className="input-line mt-2 text-sm normal-case tracking-normal text-ink" required value={form.sku} onChange={(event) => setField('sku', event.target.value)} /></label>
        <label className="label-xs block text-muted">Peso (g)<input className="input-line mt-2 text-sm normal-case tracking-normal text-ink" min="0" required type="number" value={form.weightGrams} onChange={(event) => setField('weightGrams', event.target.value)} /></label>
        {editingId ? (
          editingProduct && (
            <div className="md:col-span-3">
              <ProductImagesManager
                initialImages={editingProduct.images ?? []}
                onChange={handleImagesChanged}
                onError={setError}
                onMessage={setMessage}
                productId={editingId}
              />
            </div>
          )
        ) : (
          <>
            <label className="label-xs block text-muted">Imagen (URL)
              <input className="input-line mt-2 text-sm normal-case tracking-normal text-ink" value={form.imageUrl} onChange={(event) => setField('imageUrl', event.target.value)} placeholder="/uploads/products/xxx.png" />
            </label>
            <label className="label-xs block text-muted">O subir archivo
              <input accept="image/*" className="mt-2 w-full cursor-pointer border-b border-black/30 bg-transparent py-2 text-sm normal-case tracking-normal text-muted transition-colors file:mr-3 file:border-0 file:bg-black file:px-3 file:py-2 file:text-[11px] file:font-extrabold file:uppercase file:tracking-[0.18em] file:text-white" disabled={uploading} type="file" onChange={(event) => void handleImageUpload(event.target.files?.[0])} />
            </label>
            {form.imageUrl && (
              <div className="md:col-span-3">
                <span className="relative block h-20 w-20 border border-line">
                  <SmartImage alt="Vista previa" className="object-cover" sizes="80px" src={resolveImageUrl(form.imageUrl) ?? form.imageUrl} />
                </span>
              </div>
            )}
          </>
        )}
        <div className="flex gap-3 md:col-span-3">
          <button className="btn-primary" disabled={uploading} type="submit">
            {editingId ? 'Guardar cambios' : 'Crear producto'}
          </button>
          {editingId && <button className="btn-ghost" onClick={resetForm} type="button">Cancelar edición</button>}
        </div>
      </form>

      <div className="mt-10 overflow-x-auto border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              {['Producto', 'Marca', 'Categorías', 'Género', 'Precio', 'Stock', 'Estado'].map((heading) => (
                <th className="p-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted" key={heading}>{heading}</th>
              ))}
              <th className="p-4 text-right text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr className="border-b border-line transition-colors last:border-b-0 hover:bg-black/[0.03]" key={product.id}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {product.imageUrl
                      ? (
                        <span className="relative block h-12 w-12 shrink-0 border border-line">
                          <SmartImage alt={product.name} className="object-cover" sizes="48px" src={resolveImageUrl(product.imageUrl) ?? product.imageUrl} />
                        </span>
                      )
                      : <div className="h-12 w-12 shrink-0 border border-line bg-gradient-to-b from-white to-sand" />}
                    <div>
                      <span className="font-semibold">{product.name}</span>
                      <span className="block text-xs text-muted">{product.sku}</span>
                    </div>
                  </div>
                </td>
                <td className="p-4">{product.brandRef?.name ?? product.brand}</td>
                <td className="p-4 text-xs text-muted">
                  {product.categories.length > 0
                    ? product.categories.map((item) => item.category.name).join(' · ')
                    : '—'}
                </td>
                <td className="p-4">
                  {product.gender ? (
                    <span className="badge-flat border-black bg-black text-white">{GENDER_LABELS[product.gender]}</span>
                  ) : (
                    <span className="badge-flat text-muted">Sin clasificar</span>
                  )}
                </td>
                <td className="p-4">${Number(product.price).toLocaleString('es-AR')}</td>
                <td className="p-4">{product.stock}</td>
                <td className="p-4">
                  <span className={product.isActive ? 'badge-flat border-black bg-black text-white' : 'badge-flat text-muted'}>{product.isActive ? 'Activo' : 'Inactivo'}</span>
                </td>
                <td className="p-4 text-right">
                  <div className="inline-flex gap-2">
                    <button className="border border-black px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] transition-colors hover:bg-black hover:text-white" onClick={() => startEdit(product)} type="button">Editar</button>
                    <button className="border border-black px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] transition-colors hover:bg-black hover:text-white" onClick={() => void handleToggle(product)} type="button">{product.isActive ? 'Desactivar' : 'Activar'}</button>
                    <button className="border border-red-700/30 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-red-700 transition-colors hover:bg-red-50" onClick={() => void handleDelete(product)} type="button">Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-14 border border-line bg-white p-6">
        <h2 className="font-display text-3xl font-black uppercase tracking-[-0.02em]">Marcas</h2>
        <p className="mt-2 text-sm text-muted">Renombrá una marca o fusioná duplicados. Los productos y la tienda se actualizan solos.</p>
        <div className="mt-6 space-y-3">
          {brands.map((brand) => (
            <div className="flex flex-wrap items-center gap-3 border-b border-line pb-3 last:border-b-0 last:pb-0" key={brand.id}>
              <input
                aria-label={`Nombre de ${brand.name}`}
                className="input-line max-w-64 text-sm normal-case tracking-normal text-ink"
                value={brandNames[brand.id] ?? brand.name}
                onChange={(event) => setBrandNames((previous) => ({ ...previous, [brand.id]: event.target.value }))}
              />
              <span className="text-xs text-muted">{brand.productCount} productos</span>
              <button
                className="border border-black px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] transition-colors hover:bg-black hover:text-white disabled:opacity-40"
                disabled={busyBrand === brand.id}
                type="button"
                onClick={() => void handleRenameBrand(brand)}
              >
                Guardar nombre
              </button>
              <div className="ml-auto flex items-center gap-2">
                <select
                  aria-label={`Fusionar ${brand.name} con`}
                  className="border border-line bg-transparent py-2 pl-3 pr-8 text-xs"
                  value={mergeTargets[brand.id] ?? ''}
                  onChange={(event) => setMergeTargets((previous) => ({ ...previous, [brand.id]: event.target.value }))}
                >
                  <option value="">Fusionar con…</option>
                  {brands.filter((other) => other.id !== brand.id).map((other) => (
                    <option key={other.id} value={other.id}>{other.name}</option>
                  ))}
                </select>
                <button
                  className="border border-red-700/30 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-red-700 transition-colors hover:bg-red-50 disabled:opacity-40"
                  disabled={!mergeTargets[brand.id] || busyBrand === brand.id}
                  type="button"
                  onClick={() => void handleMergeBrand(brand)}
                >
                  Fusionar
                </button>
              </div>
            </div>
          ))}
          {brands.length === 0 ? <p className="text-sm text-muted">Todavía no hay marcas.</p> : null}
        </div>
      </section>
    </main>
  );
}
