'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '../../lib/auth';
import { useCart } from '../../lib/cart';
import { Logo } from '../../components/logo';
import { formatPrice } from '../../lib/utils';

const SHIPPING_FORM_KEY = 'lucia_checkout_shipping';

export default function CheckoutPage() {
  const { clearCart, items, subtotal } = useCart();
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
  const [formRestored, setFormRestored] = useState(false);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(SHIPPING_FORM_KEY);
    if (stored) {
      try {
        setForm((current) => ({ ...current, ...(JSON.parse(stored) as Partial<typeof form>) }));
      } catch {
        window.sessionStorage.removeItem(SHIPPING_FORM_KEY);
      }
    }
    setFormRestored(true);
    void apiFetch('/auth/me').catch(() => {
      setMessage('No pudimos verificar tu sesión. Intentá nuevamente.');
    });
  }, []);

  useEffect(() => {
    if (formRestored) {
      window.sessionStorage.setItem(SHIPPING_FORM_KEY, JSON.stringify(form));
    }
  }, [form, formRestored]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    try {
      const response = await apiFetch('/orders/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shippingAddress: { ...form, country: 'Argentina' },
        }),
      });
      const body = (await response.json().catch(() => null)) as
        | { message?: string; checkoutUrl?: string }
        | null;
      if (!response.ok) throw new Error('No pudimos iniciar el pago.');
      if (!body?.checkoutUrl) throw new Error('No pudimos iniciar el pago.');
      window.sessionStorage.removeItem(SHIPPING_FORM_KEY);
      clearCart();
      window.location.assign(body.checkoutUrl);
    } catch {
      setMessage('No pudimos iniciar el pago. Tus datos y tu carrito siguen guardados.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between">
        <a className="inline-flex min-h-11 items-center" href="/"><Logo className="text-[22px]" /></a>
        <a className="text-xs uppercase tracking-[0.18em] underline" href="/cart">Volver al carrito</a>
      </div>
      <h1 className="mt-20 font-display text-6xl font-black uppercase tracking-[-0.02em] leading-none">Checkout</h1>
      <p className="mt-5 text-muted">Completá tus datos de envío. El precio final se valida en el servidor.</p>
      <section aria-label="Resumen de la compra" className="mt-8 border border-line bg-white p-5">
        <h2 className="text-xs font-extrabold uppercase tracking-[0.2em]">Resumen de la compra</h2>
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li className="flex justify-between gap-4 text-sm" key={item.productId}>
              <span>{item.quantity} × {item.name}</span>
              <span className="shrink-0 font-semibold">{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-line pt-4 text-sm font-semibold">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
      </section>
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
            <input className="mt-2 w-full border-b border-black bg-transparent px-0 py-3 outline-none focus:border-black" required={field !== 'state' && field !== 'phone'} value={form[field]} onChange={(event) => updateField(field, event.target.value)} />
          </label>
        ))}
        <div className="md:col-span-2">
          {message && <p className="mb-4 text-sm text-muted" role="status">{message}</p>}
          <button className="w-full border border-black bg-black px-8 py-4 text-xs font-extrabold uppercase tracking-[0.22em] text-white transition hover:bg-white hover:text-black disabled:opacity-50" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Procesando...' : 'Confirmar orden'}
          </button>
        </div>
      </form>
    </main>
  );
}
