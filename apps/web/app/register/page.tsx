'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, register, saveSession } from '../../lib/auth';
import { GoogleLoginButton } from '../../components/google-login-button';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await register({ name, email, password, phone: phone || undefined });
      const session = await login(email, password);
      if ('accessToken' in session) {
        saveSession(session);
        router.push('/shop');
      } else {
        router.push('/login');
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo crear la cuenta');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <a className="font-display text-xl font-bold tracking-[0.18em]" href="/">LUCÍA</a>
        <p className="mt-16 text-xs uppercase tracking-[0.3em] text-black/50">Nueva cuenta</p>
        <h1 className="mt-3 font-display text-6xl font-bold uppercase leading-none">Creá tu cuenta</h1>
        <p className="mt-5 text-black/60">Sumate a Lucía para guardar tu carrito y seguir tus pedidos.</p>
        <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm">
            Nombre
            <input className="mt-2 w-full border-b border-black bg-transparent px-0 py-3 outline-none focus:border-gold" required minLength={2} type="text" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="block text-sm">
            Email
            <input className="mt-2 w-full border-b border-black bg-transparent px-0 py-3 outline-none focus:border-gold" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="block text-sm">
            Teléfono <span className="text-black/40">(opcional)</span>
            <input className="mt-2 w-full border-b border-black bg-transparent px-0 py-3 outline-none focus:border-gold" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>
          <label className="block text-sm">
            Contraseña
            <input className="mt-2 w-full border-b border-black bg-transparent px-0 py-3 outline-none focus:border-gold" minLength={8} required type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
          <button className="w-full border border-black bg-black px-8 py-4 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-gold hover:text-black disabled:opacity-50" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <div className="my-8 flex items-center gap-4">
          <span className="h-px flex-1 bg-black/15" />
          <span className="text-xs uppercase tracking-[0.16em] text-black/45">o conectate con</span>
          <span className="h-px flex-1 bg-black/15" />
        </div>

        <GoogleLoginButton label="Registrarme con Google" />

        <p className="mt-6 text-center text-sm text-black/60">
          ¿Ya tenés cuenta?{' '}
          <a className="font-bold underline underline-offset-4" href="/login">Ingresar</a>
        </p>
      </div>
    </main>
  );
}