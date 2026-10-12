'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearSession, me, saveAccessToken, saveSession } from '../../../lib/auth';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Completando el inicio de sesión...');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const queryParams = new URLSearchParams(window.location.search);
    const token = hashParams.get('token');

    if (queryParams.get('error')) {
      setHasError(true);
      setMessage('No se pudo iniciar sesión con Google. Intentalo de nuevo.');
      return;
    }

    if (!token) {
      setHasError(true);
      setMessage('No se recibió una sesión válida de Google.');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const profile = await me(token);
        if (cancelled) return;
        saveAccessToken(token);
        saveSession({ accessToken: token, user: profile });
        router.replace('/shop');
      } catch {
        if (cancelled) return;
        clearSession();
        setHasError(true);
        setMessage('La sesión no es válida. Volvé a intentar.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <a className="font-display text-xl font-bold tracking-[0.18em]" href="/">LUCÍA</a>
        <p className="mt-10 text-sm text-black/60">{message}</p>
        {hasError && (
          <a className="mt-8 inline-block border border-black bg-black px-8 py-4 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-gold hover:text-black" href="/login">
            Volver al inicio de sesión
          </a>
        )}
      </div>
    </main>
  );
}