'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '../../lib/auth';
import { useCart } from '../../lib/cart';
import { Logo } from '../../components/logo';
import { formatPrice } from '../../lib/utils';

const SHIPPING_FORM_KEY = 'lucia_checkout_shipping';

export default function CheckoutPage() {
  const { clearCart, items, subtotal } = useCart();
  const shipping = subtotal >= 100000 ? 0 : 15000;
  const total = subtotal + shipping;
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
    <main className="mx-auto min-h-[100dvh] max-w-5xl px-4 pb-28 pt-7 sm:px-6 sm:pb-32 sm:pt-10">
      <div className="flex items-center justify-between gap-3">
        <a className="inline-flex min-h-11 items-center" href="/"><Logo className="text-[22px]" /></a>
        <a className="inline-flex min-h-11 items-center text-[10px] uppercase tracking-[0.14em] underline sm:text-xs sm:tracking-[0.18em]" href="/cart">Volver al carrito</a>
      </div>
      <h1 className="mt-10 font-display text-[clamp(2.5rem,10vw,3.75rem)] font-black uppercase leading-none tracking-[-0.02em] md:mt-16 md:text-6xl">Checkout</h1>
      <p className="mt-4 text-sm leading-6 text-muted sm:text-base">Completá tus datos de envío. El precio final se valida en el servidor.</p>
      <div className="mt-6 grid gap-6 md:mt-8 md:grid-cols-[minmax(0,1fr)_18rem] md:items-start">
        <section aria-label="Resumen de la compra" className="border border-line bg-white p-4 md:sticky md:top-6 md:col-start-2 md:row-span-2 md:p-5">
          <h2 className="text-xs font-extrabold uppercase tracking-[0.2em]">Resumen de la compra</h2>
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li className="flex justify-between gap-4 text-sm" key={item.productId}>
                <span className="min-w-0">{item.quantity} × {item.name}</span>
                <span className="shrink-0 font-semibold">{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-line pt-4 text-sm font-semibold">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="mt-3 flex justify-between text-sm">
            <span className="text-muted">Envío</span>
            <span className="font-semibold">{shipping === 0 ? 'Gratis' : formatPrice(shipping)}</span>
          </div>
          <div className="mt-3 flex justify-between border-t border-line pt-3 font-bold">
            <span>Total estimado</span>
            <span>{formatPrice(total)}</span>
          </div>
        </section>
        <form className="grid gap-4 md:col-start-1 md:row-start-1 md:grid-cols-2 md:gap-5" onSubmit={submitOrder}>
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
              <input
                autoComplete={{
                  recipient: 'name',
                  street: 'street-address',
                  city: 'address-level2',
                  state: 'address-level1',
                  postalCode: 'postal-code',
                  phone: 'tel',
                }[field]}
                className="mt-2 w-full border-b border-black bg-transparent px-0 py-3 text-base outline-none focus:border-black"
                inputMode={field === 'postalCode' ? 'numeric' : undefined}
                required={field !== 'state' && field !== 'phone'}
                type={field === 'phone' ? 'tel' : 'text'}
                value={form[field]}
                onChange={(event) => updateField(field, event.target.value)}
              />
            </label>
          ))}
          <div className="md:col-span-2">
            {message && <p className="mb-4 text-sm text-muted" role="status">{message}</p>}
            <button className="btn-primary w-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Procesando...' : 'Confirmar orden'}
            </button>
          </div>
        </form>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between border-t border-line bg-white/95 px-4 pt-3 text-sm font-semibold shadow-[0_-8px_24px_-20px_rgba(17,17,17,0.5)] backdrop-blur md:hidden" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        <span>Total estimado</span>
        <span>{formatPrice(total)}</span>
      </div>
    </main>
  );
}
