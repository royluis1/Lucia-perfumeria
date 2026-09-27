'use client';

import { FormEvent, useState } from 'react';
import { requestPasswordReset } from '../../lib/account';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await requestPasswordReset(email);
      setStatus('sent');
    } catch (submitError) {
      setStatus('error');
      setError(submitError instanceof Error ? submitError.message : 'No se pudo enviar el correo');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <a className="font-display text-xl font-bold tracking-[0.18em]" href="/">LUCÍA</a>
        <h1 className="mt-16 font-display text-6xl font-bold uppercase leading-none">Restablecer contraseña</h1>
        {status === 'sent' ? (
          <>
            <p className="mt-8 border border-black/10 bg-white p-6 text-black/70">
              Si existe una cuenta con ese email, te enviamos un enlace para restablecer tu contraseña.
              Revisá tu bandeja de entrada (y el spam).
            </p>
            <a className="mt-8 inline-block border border-black px-6 py-3 text-xs font-bold uppercase tracking-[0.16em]" href="/login">Volver a ingresar</a>
          </>
        ) : (
          <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
            <label className="block text-sm">
              Email
              <input autoFocus className="mt-2 w-full border-b border-black bg-transparent px-0 py-3 outline-none focus:border-gold" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            {status === 'error' && <p className="text-sm text-red-700" role="alert">{error}</p>}
            <button className="w-full border border-black bg-black px-8 py-4 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-gold hover:text-black disabled:opacity-50" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Enviando...' : 'Enviar enlace'}
            </button>
            <p className="text-center text-sm text-black/60">
              <a className="font-bold underline underline-offset-4" href="/login">Volver al inicio de sesión</a>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}