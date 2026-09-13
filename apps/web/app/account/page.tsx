'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { me, getAccessToken, clearSession } from '../../lib/auth';
import type { UserProfile } from '../../lib/auth';
import { getMyOrders, updateProfile, changePassword } from '../../lib/account';
import type { Order } from '../../lib/account';

export default function AccountPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setProfileMessage('Iniciá sesión para ver tu cuenta.');
      return;
    }
    me(token)
      .then((user) => {
        setProfile(user);
        setName(user.name);
        setPhone(user.phone ?? '');
      })
      .catch(() => setProfileMessage('Tu sesión expiró. Ingresá de nuevo.'));
    getMyOrders()
      .then(setOrders)
      .catch(() => undefined);
  }, []);

  async function handleProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError('');
    setProfileMessage('');
    try {
      const result = await updateProfile({ name, phone });
      setProfile((previous) => (previous ? { ...previous, name: result.user.name, phone: result.user.phone } : previous));
      setProfileMessage('Perfil actualizado.');
    } catch (submitError) {
      setProfileError(submitError instanceof Error ? submitError.message : 'No se pudo guardar el perfil');
    }
  }

  async function handlePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError('');
    setPasswordMessage('');
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden.');
      return;
    }
    try {
      await changePassword({ currentPassword, newPassword });
      setPasswordMessage('Contraseña cambiada. Volvé a ingresar con la nueva.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (submitError) {
      setPasswordError(submitError instanceof Error ? submitError.message : 'No se pudo cambiar la contraseña');
    }
  }

  if (!profile) {
    return (
      <main className="mx-auto min-h-screen max-w-4xl px-6 py-16">
        <Link className="font-display text-xl font-bold tracking-[0.18em]" href="/">LUCÍA</Link>
        <p className="mt-20 border border-black/10 bg-white p-8 text-black/70">{profileMessage}</p>
        <Link className="mt-6 inline-block border border-black bg-black px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white" href="/login">Ingresar</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-16">
      <div className="flex items-center justify-between">
        <Link className="font-display text-xl font-bold tracking-[0.18em]" href="/">LUCÍA</Link>
        <Link className="text-xs uppercase tracking-[0.18em] underline" href="/shop">Seguir comprando</Link>
      </div>

      <p className="mt-20 text-xs uppercase tracking-[0.3em] text-black/50">Mi cuenta</p>
      <h1 className="mt-3 font-display text-6xl font-bold uppercase leading-none">Hola, {profile.name}</h1>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <section className="border border-black/10 bg-white p-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-3xl font-bold uppercase">Perfil</h2>
            <span className="text-xs uppercase tracking-[0.14em] text-black/45">{profile.email}</span>
          </div>
          <form className="mt-8 space-y-5" onSubmit={handleProfile}>
            <label className="block text-sm">
              Nombre
              <input className="mt-2 w-full border-b border-black bg-transparent px-0 py-3 outline-none focus:border-gold" required value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className="block text-sm">
              Teléfono
              <input className="mt-2 w-full border-b border-black bg-transparent px-0 py-3 outline-none focus:border-gold" value={phone ?? ''} onChange={(event) => setPhone(event.target.value)} />
            </label>
            {profileError && <p className="text-sm text-red-700" role="alert">{profileError}</p>}
            {profileMessage && <p className="text-sm text-green-800" role="status">{profileMessage}</p>}
            <button className="border border-black bg-black px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-gold hover:text-black" type="submit">Guardar</button>
          </form>
        </section>

        <section className="border border-black/10 bg-white p-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-3xl font-bold uppercase">Seguridad</h2>
          </div>
          <div className="mt-8 flex items-center justify-between gap-4 rounded border border-black/10 p-4">
            <div>
              <p className="text-sm font-semibold">Verificación en dos pasos</p>
              <p className="mt-1 text-xs text-black/55">
                {profile.mfaEnabled ? 'Activada. Te pedimos un código al ingresar.' : 'Sin activar. Agregá una capa extra de seguridad.'}
              </p>
            </div>
            <Link className="shrink-0 border border-black px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] hover:bg-gold hover:border-gold" href="/account/mfa">
              {profile.mfaEnabled ? 'Administrar' : 'Activar'}
            </Link>
          </div>
          <form className="mt-6 space-y-4" onSubmit={handlePassword}>
            <label className="block text-sm">
              Contraseña actual
              <input className="mt-2 w-full border-b border-black bg-transparent px-0 py-3 outline-none focus:border-gold" required type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                Nueva contraseña
                <input className="mt-2 w-full border-b border-black bg-transparent px-0 py-3 outline-none focus:border-gold" minLength={8} required type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
              </label>
              <label className="block text-sm">
                Repetir contraseña
                <input className="mt-2 w-full border-b border-black bg-transparent px-0 py-3 outline-none focus:border-gold" minLength={8} required type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
              </label>
            </div>
            {passwordError && <p className="text-sm text-red-700" role="alert">{passwordError}</p>}
            {passwordMessage && <p className="text-sm text-green-800" role="status">{passwordMessage}</p>}
            <button className="border border-black bg-black px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-gold hover:text-black" type="submit">Cambiar contraseña</button>
          </form>
        </section>
      </div>

      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl font-bold uppercase">Mis pedidos</h2>
          {profile.role === 'ADMIN' || profile.role === 'SUPERADMIN' ? (
            <Link className="text-xs uppercase tracking-[0.14em] underline" href="/admin">Ir al panel admin</Link>
          ) : null}
        </div>
        <div className="mt-6 space-y-4">
          {orders.length === 0 && <p className="border border-black/10 bg-white p-6 text-black/60">Todavía no tenés pedidos.</p>}
          {orders.map((order) => (
            <article className="border border-black/10 bg-white p-6" key={order.id}>
              <div className="flex flex-wrap justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.15em]">Pedido {order.id.slice(0, 8)}</p>
                <p className="text-sm font-semibold">${order.total}</p>
              </div>
              <p className="mt-3 text-sm text-black/60">{new Date(order.createdAt).toLocaleDateString('es-AR')} · {order.status} · Pago {order.paymentStatus}</p>
              <ul className="mt-4 space-y-1 text-sm">
                {order.items.map((item, index) => <li key={`${order.id}-${index}`}>{item.quantity} × {item.product.name} ({item.product.brand})</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-16 border-t border-black/10 pt-8">
        <button
          className="text-xs uppercase tracking-[0.16em] text-black/50 underline underline-offset-4"
          type="button"
          onClick={() => { clearSession(); window.location.href = '/'; }}
        >
          Cerrar sesión
        </button>
      </div>
    </main>
  );
}