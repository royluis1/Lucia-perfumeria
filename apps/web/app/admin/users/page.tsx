'use client';

import { useEffect, useState } from 'react';
import { listAdminUsers, updateAdminUser } from '../../../lib/admin';
import type { AdminUser } from '../../../lib/admin';

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
      <div className="flex justify-between">
        <a className="font-display text-xl font-bold tracking-[0.18em]" href="/admin">LUCÍA</a>
        <a className="text-xs uppercase tracking-[0.18em] underline" href="/shop">Tienda</a>
      </div>
      <a className="mt-10 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-black/55 transition hover:text-black" href="/admin"><span aria-hidden="true">←</span>Volver al panel</a>
      <h1 className="mt-5 font-display text-6xl font-bold uppercase">Usuarios</h1>
      {message && <p className="mt-6 text-sm text-green-900" role="status">{message}</p>}
      {error && <p className="mt-6 text-sm text-red-700" role="alert">{error}</p>}

      <div className="mt-10 overflow-x-auto border border-black/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-xs uppercase tracking-[0.12em]">
              <th className="p-4">Usuario</th><th className="p-4">Email</th><th className="p-4">Pedidos</th><th className="p-4">Doble factor</th><th className="p-4">Rol</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr className="border-b border-black/5" key={user.id}>
                <td className="p-4">
                  <span className="font-semibold">{user.name ?? '—'}</span>
                  {user.phone && <span className="block text-xs text-black/50">{user.phone}</span>}
                </td>
                <td className="p-4">{user.email}</td>
                <td className="p-4">{user._count.orders}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className={user.mfaEnabled ? 'text-green-800' : 'text-black/40'}>{user.mfaEnabled ? 'Activado' : 'Desactivado'}</span>
                    {user.mfaEnabled && <button className="border border-red-200 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-red-700 hover:bg-red-50" onClick={() => void handleMfaToggle(user)} type="button">Resetear</button>}
                  </div>
                </td>
                <td className="p-4">
                  <select className="border border-black/15 bg-white py-1.5 pl-2 outline-none" value={user.role} onChange={(event) => void handleRoleChange(user, event.target.value)}>
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