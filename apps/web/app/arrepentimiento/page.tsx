'use client';

import { useState } from 'react';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function ArrepentimientoPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    setError('');

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get('name') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
      orderNumber: String(formData.get('orderNumber') ?? '').trim() || undefined,
      reason: String(formData.get('reason') ?? '').trim(),
    };

    if (!payload.name || !payload.email || !payload.reason) {
      setStatus('error');
      setError('Completá los campos obligatorios antes de enviar.');
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3005';
    try {
      const response = await fetch(`${apiUrl}/cancellations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('No se pudo registrar la solicitud');
      }
      setStatus('success');
    } catch {
      setStatus('error');
      setError('Se produjo un error al registrar la solicitud. Intentá de nuevo más tarde.');
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <p className="text-xs uppercase tracking-[0.3em] text-black/50">Derecho de arrepentimiento</p>
      <h1 className="mt-3 font-display text-5xl font-bold uppercase tracking-[-0.03em]">Quiero revocar la compra</h1>
      <p className="mt-6 max-w-2xl text-sm leading-7 text-black/65">
        Si compraste en Lucía Perfumería y te arrepentís, podés revocar la
        operación dentro de los <strong>10 días corridos</strong> desde la compra
        o la recepción del producto (Ley de Defensa del Consumidor 24.240, art.
        34; Resolución 424/2020 - SPA). Completá el formulario y vamos a
        contactarte a la brevedad.
      </p>

      {status === 'success' ? (
        <div className="mt-10 border border-black/15 bg-gold-soft px-6 py-8">
          <h2 className="font-display text-2xl font-bold uppercase">Solicitud registrada</h2>
          <p className="mt-3 text-sm leading-6 text-black/65">
            Recibimos tu pedido de revocación. Te vamos a responder por mail con
            el número de trámite y los pasos para la devolución del dinero.
          </p>
        </div>
      ) : (
        <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Nombre y apellido *" name="name" required />
            <Field label="Correo electrónico *" name="email" type="email" required />
          </div>
          <Field label="Número de pedido (si lo tenés a mano)" name="orderNumber" />
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em]" htmlFor="reason">
              Motivo *
            </label>
            <textarea
              className="w-full border border-black/20 bg-transparent px-4 py-3 text-sm outline-none focus:border-black"
              id="reason"
              maxLength={1000}
              name="reason"
              placeholder="Contanos en qué producto y por qué querés revocar la compra"
              required
              rows={5}
            />
          </div>
          <button
            className="inline-flex items-center gap-2 border border-black bg-black px-7 py-4 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-gold hover:text-black"
            disabled={status === 'loading'}
            type="submit"
          >
            {status === 'loading' ? 'Enviando…' : 'Enviar solicitud'}
          </button>
          {status === 'error' && <p className="text-sm font-semibold text-red-600">{error}</p>}
        </form>
      )}
    </main>
  );
}

function Field({ label, name, type = 'text', required = false }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em]" htmlFor={name}>
        {label}
      </label>
      <input
        className="w-full border border-black/20 bg-transparent px-4 py-3 text-sm outline-none focus:border-black"
        id={name}
        name={name}
        type={type}
        required={required}
      />
    </div>
  );
}