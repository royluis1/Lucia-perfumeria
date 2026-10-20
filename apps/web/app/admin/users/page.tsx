'use client';

import { useEffect, useState } from 'react';
import { listAdminUsers, updateAdminUser } from '../../../lib/admin';
import type { AdminUser } from '../../../lib/admin';
import { Logo } from '../../../components/logo';

const roles = ['CUSTOMER', 'ADMIN', 'SUPERADMIN'];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      setUsers(await listAdminUsers());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los usuarios.');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleRoleChange(user: AdminUser, role: string) {
    setError('');
    if (role === user.role) return;
    if (!window.confirm(`Cambiar el rol de ${user.email} a ${role}?`)) {
      await load();
      return;
    }
    try {
      await updateAdminUser(user.id, { role });
      setMessage(`Rol de ${user.email} actualizado a ${role}.`);
      await load();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'No se pudo actualizar el rol');
      await load();
    }
  }

  async function handleMfaToggle(user: AdminUser) {
    setError('');
    if (!user.mfaEnabled) return;
    if (!window.confirm(`Desactivar el doble factor de ${user.email}?`)) return;
    try {
      await updateAdminUser(user.id, { mfaEnabled: false });
      setMessage(`Doble factor desactivado en ${user.email}.`);
      await load();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'No se pudo actualizar el usuario');
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex items-center justify-between">
        <a className="font-display text-xl" href="/admin" aria-label="Panel admin"><Logo className="text-xl" /></a>
        <a className="ul text-xs font-semibold uppercase tracking-[0.22em]" href="/shop">Tienda</a>
      </div>
      <a className="mt-10 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.22em] text-muted transition-colors hover:text-black" href="/admin"><span aria-hidden="true">←</span>Volver al panel</a>
      <h1 className="mt-5 font-display text-6xl font-black uppercase tracking-[-0.02em]">Usuarios</h1>
      {message && <p className="mt-6 border border-line bg-white px-4 py-3 text-sm" role="status">{message}</p>}
      {error && <p className="mt-6 border border-red-700/30 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}

      <div className="mt-10 overflow-x-auto border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="p-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Usuario</th><th className="p-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Email</th><th className="p-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Pedidos</th><th className="p-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Doble factor</th><th className="p-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Rol</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr className="border-b border-line transition-colors last:border-b-0 hover:bg-black/[0.03]" key={user.id}>
                <td className="p-4">
                  <span className="font-semibold">{user.name ?? '—'}</span>
                  {user.phone && <span className="block text-xs text-muted">{user.phone}</span>}
                </td>
                <td className="p-4">{user.email}</td>
                <td className="p-4">{user._count.orders}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className={user.mfaEnabled ? 'badge-flat border-black bg-black text-white' : 'badge-flat text-muted'}>{user.mfaEnabled ? 'Activado' : 'Desactivado'}</span>
                    {user.mfaEnabled && <button className="border border-red-700/30 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-red-700 transition-colors hover:bg-red-50" onClick={() => void handleMfaToggle(user)} type="button">Resetear</button>}
                  </div>
                </td>
                <td className="p-4">
                  <select className="border-b border-black/30 bg-transparent py-1.5 outline-none transition-colors focus:border-black" value={user.role} onChange={(event) => void handleRoleChange(user, event.target.value)}>
                    {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}