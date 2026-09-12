'use client';

import { FormEvent, useEffect, useState } from 'react';
import { getAccessToken } from '../../../lib/auth';

type Product = { id: string; name: string; brand: string; price: string; stock: number; isActive: boolean };
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3005';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ slug: '', name: '', brand: '', description: '', price: '', stock: '', sku: '', weightGrams: '' });

  async function loadProducts() {
    const token = getAccessToken();
    if (!token) return setMessage('Iniciá sesión con una cuenta administradora.');
    const response = await fetch(`${apiUrl}/admin/products`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return setMessage('No tenés permisos para ver este módulo.');
    setProducts(await response.json() as Product[]);
  }

  useEffect(() => { void loadProducts(); }, []);

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    const response = await fetch(`${apiUrl}/admin/products`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, price: Number(form.price), stock: Number(form.stock), weightGrams: Number(form.weightGrams) }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { message?: string } | null;
      setMessage(body?.message ?? 'No se pudo crear el producto');
      return;
    }
    setMessage('Producto creado correctamente');
    setForm({ slug: '', name: '', brand: '', description: '', price: '', stock: '', sku: '', weightGrams: '' });
    await loadProducts();
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex justify-between"><a className="font-display text-xl font-bold tracking-[0.18em]" href="/admin">LUCÍA</a><a className="text-xs uppercase tracking-[0.18em] underline" href="/shop">Tienda</a></div>
      <h1 className="mt-16 font-display text-6xl font-bold uppercase">Productos</h1>
      {message && <p className="mt-6 text-sm text-black/65" role="status">{message}</p>}
      <form className="mt-10 grid gap-4 border border-black/10 bg-white p-6 md:grid-cols-4" onSubmit={createProduct}>
        {Object.entries({ slug: 'Slug', name: 'Nombre', brand: 'Marca', description: 'Descripción', price: 'Precio', stock: 'Stock', sku: 'SKU', weightGrams: 'Peso (g)' }).map(([field, label]) => (
          <label className="text-sm" key={field}>{label}<input className="mt-2 w-full border-b border-black bg-transparent py-2 outline-none" required value={form[field as keyof typeof form]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} /></label>
        ))}
        <button className="border border-black bg-black px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-gold hover:text-black md:col-span-4" type="submit">Crear producto</button>
      </form>
      <div className="mt-10 overflow-x-auto border border-black/10 bg-white">
        <table className="w-full text-left text-sm"><thead><tr className="border-b border-black/10 text-xs uppercase tracking-[0.12em]"><th className="p-4">Producto</th><th className="p-4">Precio</th><th className="p-4">Stock</th><th className="p-4">Estado</th></tr></thead><tbody>{products.map((product) => <tr className="border-b border-black/5" key={product.id}><td className="p-4">{product.name}<span className="block text-xs text-black/50">{product.brand}</span></td><td className="p-4">${product.price}</td><td className="p-4">{product.stock}</td><td className="p-4">{product.isActive ? 'Activo' : 'Inactivo'}</td></tr>)}</tbody></table>
      </div>
    </main>
  );
}
