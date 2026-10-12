'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { me, getAccessToken } from '../../../lib/auth';
import { setupMfa, enableMfa, disableMfa } from '../../../lib/account';

export default function MfaPage() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [setup, setSetup] = useState<{ secret: string; qrDataUrl: string } | null>(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setMessage('Iniciá sesión para administrar tu seguridad.');
      return;
    }
    me(token)
      .then((user) => setEnabled(user.mfaEnabled))
      .catch(() => setMessage('Tu sesión expiró. Ingresá de nuevo.'));
  }, []);

  async function handleStartSetup() {
    setError('');
    setBusy(true);
    try {
      const result = await setupMfa();
      setSetup({ secret: result.secret, qrDataUrl: result.qrDataUrl });
    } catch (setupError) {
      setError(setupError instanceof Error ? setupError.message : 'No se pudo generar el código');
    } finally {
      setBusy(false);
    }
  }

  async function handleEnable() {
    setError('');
    setBusy(true);
    try {
      await enableMfa(code);
      setEnabled(true);
      setSetup(null);
      setCode('');
      setMessage('Verificación en dos pasos activada.');
    } catch (enableError) {
      setError(enableError instanceof Error ? enableError.message : 'Código inválido');
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setError('');
    setBusy(true);
    try {
      await disableMfa(code);
      setEnabled(false);
      setCode('');
      setMessage('Verificación en dos pasos desactivada.');
    } catch (disableError) {
      setError(disableError instanceof Error ? disableError.message : 'Código inválido');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between">
        <Link className="font-display text-xl font-bold tracking-[0.18em]" href="/">LUCÍA</Link>
        <Link className="text-xs uppercase tracking-[0.18em] underline" href="/account">Volver a mi cuenta</Link>
      </div>

      <p className="mt-20 text-xs uppercase tracking-[0.3em] text-black/50">Seguridad</p>
      <h1 className="mt-3 font-display text-6xl font-bold uppercase leading-none">Verificación en dos pasos</h1>
      <p className="mt-5 max-w-xl text-black/60">
        Usá una app como Google Authenticator o Authy para recibir un código de 6 dígitos al iniciar sesión.
        Guardá el código QR o la clave secreta en un lugar seguro.
      </p>

      {message && <p className="mt-8 border border-black/10 bg-white p-6 text-green-900">{message}</p>}

      {enabled === true && (
        <section className="mt-10 border border-black/10 bg-white p-8">
          <h2 className="font-display text-3xl font-bold uppercase">Desactivar</h2>
          <p className="mt-3 text-sm text-black/60">Ingresá el código actual de tu aplicación para confirmar.</p>
          <div className="mt-6 flex max-w-xs items-end gap-3">
            <label className="block flex-1 text-sm">
              Código de 6 dígitos
              <input
                autoFocus
                className="mt-2 w-full border-b border-black bg-transparent py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-gold"
                inputMode="numeric"
                maxLength={6}
                pattern="\d{6}"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
              />
            </label>
            <button className="border border-black bg-black px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-gold hover:text-black disabled:opacity-50" disabled={busy || code.length !== 6} onClick={handleDisable} type="button">Desactivar</button>
          </div>
          {error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}
        </section>
      )}

      {enabled === false && !setup && (
        <button
          className="mt-10 border border-black bg-black px-8 py-4 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-gold hover:text-black disabled:opacity-50"
          disabled={busy}
          onClick={handleStartSetup}
          type="button"
        >
          {busy ? 'Generando...' : 'Activar verificación en dos pasos'}
        </button>
      )}

      {setup && (
        <section className="mt-10 border border-black/10 bg-white p-8">
          <h2 className="font-display text-3xl font-bold uppercase">Escaneá el código QR</h2>
          <div className="mt-6 flex flex-wrap items-start gap-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="h-56 w-56 bg-white" src={setup.qrDataUrl} alt="Código QR para configurar la aplicación de autenticación" />
            <div className="min-w-[16rem] flex-1">
              <p className="text-sm text-black/60">O ingresá esta clave manualmente en tu app:</p>
              <code className="mt-3 block break-all border border-black/10 bg-canvas p-4 text-sm tracking-widest">{setup.secret}</code>
              <div className="mt-6 flex max-w-xs items-end gap-3">
                <label className="block flex-1 text-sm">
                  Código de confirmación
                  <input
                    className="mt-2 w-full border-b border-black bg-transparent py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-gold"
                    inputMode="numeric"
                    maxLength={6}
                    pattern="\d{6}"
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                  />
                </label>
                <button className="border border-black bg-black px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-gold hover:text-black disabled:opacity-50" disabled={busy || code.length !== 6} onClick={handleEnable} type="button">
                  {busy ? 'Verificando...' : 'Activar'}
                </button>
              </div>
            </div>
          </div>
          {error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}
        </section>
      )}
    </main>
  );
}