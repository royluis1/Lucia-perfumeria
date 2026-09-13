'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login, saveSession } from '../../lib/auth';
import { verifyMfa } from '../../lib/account';
import { GoogleLoginButton } from '../../components/google-login-button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const session = await login(email, password);
      if ('accessToken' in session) {
        saveSession(session);
        router.push('/shop');
        return;
      }
      setMfaToken(session.mfaToken);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo iniciar sesión');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMfa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mfaToken) return;
    setError('');
    setIsSubmitting(true);
    try {
      const session = await verifyMfa(mfaToken, code);
      saveSession(session);
      router.push('/shop');
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'Código inválido');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <a className="font-display text-xl font-bold tracking-[0.18em]" href="/">LUCÍA</a>
        <h1 className="mt-16 font-display text-6xl font-bold uppercase leading-none">Bienvenida</h1>
        <p className="mt-5 text-black/60">
          {mfaToken ? 'Ingresá el código de 6 dígitos de tu aplicación de autenticación.' : 'Ingresá para ver tu carrito y tus pedidos.'}
        </p>
        {mfaToken ? (
          <form className="mt-10 space-y-5" onSubmit={handleMfa}>
            <label className="block text-sm">
              Código de seguridad
              <input
                autoFocus
                className="mt-2 w-full border-b border-black bg-transparent px-0 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-gold"
                inputMode="numeric"
                maxLength={6}
                pattern="\d{6}"
                placeholder="000000"
                required
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
              />
            </label>
            {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
            <button className="w-full border border-black bg-black px-8 py-4 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-gold hover:text-black disabled:opacity-50" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Verificando...' : 'Verificar código'}
            </button>
            <button
              className="w-full text-center text-xs uppercase tracking-[0.16em] text-black/50 underline underline-offset-4"
              type="button"
              onClick={() => { setMfaToken(null); setCode(''); setError(''); }}
            >
              Volver al inicio de sesión
            </button>
          </form>
        ) : (
          <>
            <form className="mt-10 space-y-5" onSubmit={handleLogin}>
              <label className="block text-sm">
                Email
                <input className="mt-2 w-full border-b border-black bg-transparent px-0 py-3 outline-none focus:border-gold" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </label>
              <label className="block text-sm">
                Contraseña
                <input className="mt-2 w-full border-b border-black bg-transparent px-0 py-3 outline-none focus:border-gold" minLength={8} required type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              </label>
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-black/50">
                <Link className="underline underline-offset-4 hover:text-black" href="/forgot-password">¿Olvidaste tu contraseña?</Link>
              </div>
              {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
              <button className="w-full border border-black bg-black px-8 py-4 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-gold hover:text-black disabled:opacity-50" disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>

            <div className="my-8 flex items-center gap-4">
              <span className="h-px flex-1 bg-black/15" />
              <span className="text-xs uppercase tracking-[0.16em] text-black/45">o conectate con</span>
              <span className="h-px flex-1 bg-black/15" />
            </div>

            <GoogleLoginButton />
          </>
        )}

        {!mfaToken && (
          <p className="mt-6 text-center text-sm text-black/60">
            ¿Todavía no tenés cuenta?{' '}
            <a className="font-bold underline underline-offset-4" href="/register">Crear una</a>
          </p>
        )}
      </div>
    </main>
  );
}
