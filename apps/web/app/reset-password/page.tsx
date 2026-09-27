'use client';

import { FormEvent, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { resetPassword } from '../../lib/account';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'done' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      setStatus('error');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await resetPassword(token, password);
      setStatus('done');
    } catch (submitError) {
      setStatus('error');
      setError(submitError instanceof Error ? submitError.message : 'No se pudo restablecer la contraseña');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <a className="font-display text-xl font-bold tracking-[0.18em]" href="/">LUCÍA</a>
        <h1 className="mt-16 font-display text-6xl font-bold uppercase leading-none">Nueva contraseña</h1>
        {status === 'done' ? (
          <>
            <p className="mt-8 border border-black/10 bg-white p-6 text-black/70">
              Tu contraseña se actualizó correctamente. Se cerraron tus otras sesiones por seguridad.
            </p>
            <Link className="mt-8 inline-block border border-black bg-black px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white hover:bg-gold hover:text-black" href="/login">Ingresar</Link>
          </>
        ) : token ? (
          <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
            <label className="block text-sm">
              Nueva contraseña
              <input autoFocus className="mt-2 w-full border-b border-black bg-transparent px-0 py-3 outline-none focus:border-gold" minLength={8} required type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <label className="block text-sm">
              Repetí la contraseña
              <input className="mt-2 w-full border-b border-black bg-transparent px-0 py-3 outline-none focus:border-gold" minLength={8} required type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} />
            </label>
            {status === 'error' && <p className="text-sm text-red-700" role="alert">{error}</p>}
            <button className="w-full border border-black bg-black px-8 py-4 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-gold hover:text-black disabled:opacity-50" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Guardando...' : 'Guardar contraseña'}
            </button>
          </form>
        ) : (
          <p className="mt-8 border border-black/10 bg-white p-6 text-black/70">
            El enlace no es válido o expiró. Por favor pedí uno nuevo.
          </p>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}