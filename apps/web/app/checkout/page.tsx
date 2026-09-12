'use client';

import { FormEvent, useEffect, useState } from 'react';
import { getAccessToken } from '../../lib/auth';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function CheckoutPage() {
  const [form, setForm] = useState({
    recipient: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    phone: '',
  });
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token) {
      window.location.href = '/login';
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    try {
      const response = await fetch(`${apiUrl}/orders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shippingAddress: { ...form, country: 'Argentina' },
        }),
      });
      const body = (await response.json().catch(() => null)) as { message?: string; id?: string } | null;
      if (!response.ok) throw new Error(body?.message ?? 'No se pudo crear la orden');
      setMessage(`Orden creada correctamente${body?.id ? `: ${body.id}` : ''}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo crear la orden');
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (!getAccessToken()) setMessage('Iniciá sesión para completar tu compra.');
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between">
        <a className="font-display text-xl font-bold tracking-[0.18em]" href="/">LUCÍA</a>
        <a className="text-xs uppercase tracking-[0.18em] underline" href="/cart">Volver al carrito</a>
      </div>
      <h1 className="mt-20 font-display text-6xl font-bold uppercase leading-none">Checkout</h1>
      <p className="mt-5 text-black/60">Completá tus datos de envío. El precio final se valida en el servidor.</p>
      <form className="mt-10 grid gap-5 md:grid-cols-2" onSubmit={submitOrder}>
        {([
          ['recipient', 'Nombre completo'],
          ['street', 'Calle y número'],
          ['city', 'Ciudad'],
          ['state', 'Provincia'],
          ['postalCode', 'Código postal'],
          ['phone', 'Teléfono'],
        ] as const).map(([field, label]) => (
          <label className="block text-sm" key={field}>
            {label}
            <input className="mt-2 w-full border-b border-black bg-transparent px-0 py-3 outline-none focus:border-gold" required={field !== 'state' && field !== 'phone'} value={form[field]} onChange={(event) => updateField(field, event.target.value)} />
          </label>
        ))}
        <div className="md:col-span-2">
          {message && <p className="mb-4 text-sm text-black/65" role="status">{message}</p>}
          <button className="w-full border border-black bg-black px-8 py-4 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-gold hover:text-black disabled:opacity-50" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Procesando...' : 'Confirmar orden'}
          </button>
        </div>
      </form>
    </main>
  );
}
