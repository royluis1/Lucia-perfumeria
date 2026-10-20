'use client';

import { FormEvent, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  listAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deactivateAdminProduct,
  uploadImage,
  revalidateHome,
} from '../../../lib/admin';
import type { AdminProduct, AdminProductImage } from '../../../lib/admin';
import { resolveImageUrl } from '../../../lib/api';
import { Logo } from '../../../components/logo';
import { SmartImage } from '../../../components/smart-image';

const ProductImagesManager = dynamic(
  () => import('../../../components/admin/product-images').then((mod) => mod.ProductImagesManager),
  { ssr: false, loading: () => <p className="text-xs text-muted">Cargando gestor de fotos…</p> },
);

const categories = ['Florales', 'Cítricos', 'Amaderados', 'Uncategorized'];
const emptyForm = {
  slug: '',
  name: '',
  brand: '',
  description: '',
  price: '',
  stock: '',
  sku: '',
  weightGrams: '',
  category: 'Florales',
  imageUrl: '',
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function loadProducts() {
    try {
      const data = await listAdminProducts();
      setProducts(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el catálogo.');
      setProducts([]);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  function setField(field: keyof typeof form, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function startEdit(product: AdminProduct) {
    setEditingId(product.id);
    setError('');
    setMessage('');
    setForm({
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      description: product.description,
      price: String(Number(product.price)),
      stock: String(product.stock),
      sku: product.sku,
      weightGrams: String(product.weightGrams),
      category: product.category,
      imageUrl: product.imageUrl ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  const editingProduct = products.find((product) => product.id === editingId) ?? null;

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
    const payload = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      brand: form.brand.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      sku: form.sku.trim(),
      weightGrams: Number(form.weightGrams),
      category: form.category,
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
      await loadProducts();
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
        <label className="label-xs block text-muted">Marca<input className="input-line mt-2 text-sm normal-case tracking-normal text-ink" required value={form.brand} onChange={(event) => setField('brand', event.target.value)} /></label>
        <label className="label-xs block text-muted">Slug<input className="input-line mt-2 text-sm normal-case tracking-normal text-ink" required value={form.slug} onChange={(event) => setField('slug', event.target.value)} placeholder="ej: mi-perfume" /></label>
        <label className="label-xs block text-muted md:col-span-2">Descripción<textarea className="input-line mt-2 text-sm normal-case tracking-normal text-ink" required rows={2} value={form.description} onChange={(event) => setField('description', event.target.value)} /></label>
        <label className="label-xs block text-muted">Categoría
          <select className="input-line mt-2 text-sm normal-case tracking-normal text-ink" value={form.category} onChange={(event) => setField('category', event.target.value)}>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
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
              {['Producto', 'Categoría', 'Precio', 'Stock', 'Estado'].map((heading) => (
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
                      <span className="block text-xs text-muted">{product.brand} · {product.sku}</span>
                    </div>
                  </div>
                </td>
                <td className="p-4">{product.category}</td>
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
    </main>
  );
}