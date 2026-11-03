'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AUTH_REDIRECT_KEY,
  clearSession,
  getAccessToken,
  getSafeRedirectDestination,
  me,
  saveAccessToken,
  saveSession,
} from '../../../lib/auth';
import { Logo } from '../../../components/logo';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Completando el inicio de sesión...');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const queryParams = new URLSearchParams(window.location.search);
    const token = hashParams.get('token');
    const destination = getSafeRedirectDestination(
      window.sessionStorage.getItem(AUTH_REDIRECT_KEY) ?? queryParams.get('redirect'),
    );

    if (queryParams.get('error')) {
      window.sessionStorage.removeItem(AUTH_REDIRECT_KEY);
      setHasError(true);
      setMessage('No se pudo iniciar sesión con Google. Intentalo de nuevo.');
      return;
    }

    if (!token) {
      window.sessionStorage.removeItem(AUTH_REDIRECT_KEY);
      setHasError(true);
      setMessage('No se recibió una sesión válida de Google.');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        saveAccessToken(token);
        const profile = await me(token, false);
        if (cancelled) return;
        saveSession({ accessToken: getAccessToken() ?? token, user: profile });
        window.sessionStorage.removeItem(AUTH_REDIRECT_KEY);
        router.replace(destination);
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
        <a className="inline-flex min-h-11 items-center" href="/"><Logo className="text-[22px]" /></a>
        <p className="mt-10 text-sm text-muted">{message}</p>
        {hasError && (
          <a className="mt-8 inline-block border border-black bg-black px-8 py-4 text-xs font-extrabold uppercase tracking-[0.22em] text-white transition hover:bg-white hover:text-black" href="/login">
            Volver al inicio de sesión
          </a>
        )}
      </div>
    </main>
  );
}