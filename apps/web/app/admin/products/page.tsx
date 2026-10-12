'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  listAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deactivateAdminProduct,
  uploadImage,
} from '../../../lib/admin';
import type { AdminProduct } from '../../../lib/admin';

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
      ...(form.imageUrl ? { imageUrl: form.imageUrl } : {}),
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
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo guardar el producto');
    }
  }

  async function handleToggle(product: AdminProduct) {
    try {
      await updateAdminProduct(product.id, { isActive: !product.isActive });
      await loadProducts();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'No se pudo actualizar el estado');
    }
  }

  async function handleDelete(product: AdminProduct) {
    if (!window.confirm(`¿Desactivar "${product.name}"? No se elimina del historial de pedidos.`)) return;
    try {
      await deactivateAdminProduct(product.id);
      await loadProducts();
      setMessage('Producto desactivado.');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo desactivar el producto');
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <div className="flex justify-between">
        <a className="font-display text-xl font-bold tracking-[0.18em]" href="/admin">LUCÍA</a>
        <a className="text-xs uppercase tracking-[0.18em] underline" href="/shop">Tienda</a>
      </div>
      <a className="mt-10 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-black/55 transition hover:text-black" href="/admin"><span aria-hidden="true">←</span>Volver al panel</a>
      <h1 className="mt-5 font-display text-6xl font-bold uppercase">Productos</h1>
      {message && <p className="mt-6 text-sm text-green-900" role="status">{message}</p>}
      {error && <p className="mt-6 text-sm text-red-700" role="alert">{error}</p>}

      <form className="mt-10 grid gap-4 border border-black/10 bg-white p-6 md:grid-cols-3" onSubmit={handleSubmit}>
        <label className="text-sm">Nombre<input className="mt-2 w-full border-b border-black bg-transparent py-2 outline-none" required value={form.name} onChange={(event) => setField('name', event.target.value)} /></label>
        <label className="text-sm">Marca<input className="mt-2 w-full border-b border-black bg-transparent py-2 outline-none" required value={form.brand} onChange={(event) => setField('brand', event.target.value)} /></label>
        <label className="text-sm">Slug<input className="mt-2 w-full border-b border-black bg-transparent py-2 outline-none" required value={form.slug} onChange={(event) => setField('slug', event.target.value)} placeholder="ej: mi-perfume" /></label>
        <label className="text-sm md:col-span-2">Descripción<textarea className="mt-2 w-full border-b border-black bg-transparent py-2 outline-none" required rows={2} value={form.description} onChange={(event) => setField('description', event.target.value)} /></label>
        <label className="text-sm">Categoría
          <select className="mt-2 w-full border-b border-black bg-transparent py-2 outline-none" value={form.category} onChange={(event) => setField('category', event.target.value)}>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <label className="text-sm">Precio (ARS)<input className="mt-2 w-full border-b border-black bg-transparent py-2 outline-none" min="0.01" required step="0.01" type="number" value={form.price} onChange={(event) => setField('price', event.target.value)} /></label>
        <label className="text-sm">Stock<input className="mt-2 w-full border-b border-black bg-transparent py-2 outline-none" min="0" required type="number" value={form.stock} onChange={(event) => setField('stock', event.target.value)} /></label>
        <label className="text-sm">SKU<input className="mt-2 w-full border-b border-black bg-transparent py-2 outline-none" required value={form.sku} onChange={(event) => setField('sku', event.target.value)} /></label>
        <label className="text-sm">Peso (g)<input className="mt-2 w-full border-b border-black bg-transparent py-2 outline-none" min="0" required type="number" value={form.weightGrams} onChange={(event) => setField('weightGrams', event.target.value)} /></label>
        <label className="text-sm">Imagen (URL)
          <input className="mt-2 w-full border-b border-black bg-transparent py-2 outline-none" value={form.imageUrl} onChange={(event) => setField('imageUrl', event.target.value)} placeholder="/uploads/products/xxx.png" />
        </label>
        <label className="text-sm">O subir archivo
          <input accept="image/*" className="mt-2 w-full border-b border-black bg-transparent py-2 text-sm" disabled={uploading} type="file" onChange={(event) => void handleImageUpload(event.target.files?.[0])} />
        </label>
        {form.imageUrl && <div className="md:col-span-3">{/* eslint-disable-next-line @next/next/no-img-element */}<img className="h-20 w-20 object-cover border border-black/10" src={form.imageUrl} alt="Vista previa" /></div>}
        <div className="flex gap-3 md:col-span-3">
          <button className="border border-black bg-black px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-gold hover:text-black disabled:opacity-50" disabled={uploading} type="submit">
            {editingId ? 'Guardar cambios' : 'Crear producto'}
          </button>
          {editingId && <button className="border border-black/20 px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] hover:bg-gold-soft" onClick={resetForm} type="button">Cancelar edición</button>}
        </div>
      </form>

      <div className="mt-10 overflow-x-auto border border-black/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-xs uppercase tracking-[0.12em]">
              <th className="p-4">Producto</th><th className="p-4">Categoría</th><th className="p-4">Precio</th><th className="p-4">Stock</th><th className="p-4">Estado</th><th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr className="border-b border-black/5" key={product.id}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {product.imageUrl
                      ? /* eslint-disable-next-line @next/next/no-img-element */ <img className="h-12 w-12 object-cover" src={product.imageUrl} alt="" />
                      : <div className="h-12 w-12 bg-gradient-to-b from-white to-black/10" />}
                    <div>
                      <span className="font-semibold">{product.name}</span>
                      <span className="block text-xs text-black/50">{product.brand} · {product.sku}</span>
                    </div>
                  </div>
                </td>
                <td className="p-4">{product.category}</td>
                <td className="p-4">${Number(product.price).toLocaleString('es-AR')}</td>
                <td className="p-4">{product.stock}</td>
                <td className="p-4">{product.isActive ? 'Activo' : 'Inactivo'}</td>
                <td className="p-4 text-right">
                  <div className="inline-flex gap-2">
                    <button className="border border-black px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] hover:bg-gold-soft" onClick={() => startEdit(product)} type="button">Editar</button>
                    <button className="border border-black px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] hover:bg-gold-soft" onClick={() => void handleToggle(product)} type="button">{product.isActive ? 'Desactivar' : 'Activar'}</button>
                    <button className="border border-red-200 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-red-700 hover:bg-red-50" onClick={() => void handleDelete(product)} type="button">Eliminar</button>
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