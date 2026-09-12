'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, saveSession } from '../../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const session = await login(email, password);
      saveSession(session);
      router.push('/shop');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo iniciar sesión');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <a className="font-display text-xl font-bold tracking-[0.18em]" href="/">LUCÍA</a>
        <h1 className="mt-16 font-display text-6xl font-bold uppercase leading-none">Bienvenida</h1>
        <p className="mt-5 text-black/60">Ingresá para ver tu carrito y tus pedidos.</p>
        <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm">
            Email
            <input className="mt-2 w-full border-b border-black bg-transparent px-0 py-3 outline-none focus:border-gold" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="block text-sm">
            Contraseña
            <input className="mt-2 w-full border-b border-black bg-transparent px-0 py-3 outline-none focus:border-gold" minLength={8} required type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
          <button className="w-full border border-black bg-black px-8 py-4 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-gold hover:text-black disabled:opacity-50" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </main>
  );
}
