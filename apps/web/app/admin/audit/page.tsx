'use client';

import { useEffect, useState } from 'react';
import { getAccessToken } from '../../../lib/auth';

type AuditEntry = {
  id: string;
  actor: { email: string } | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: unknown;
  createdAt: string;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3005';

export default function AdminAuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setMessage('Iniciá sesión con una cuenta administradora.');
      return;
    }
    fetch(`${apiUrl}/admin/audit?limit=50`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error('No tenés permisos para ver este módulo.');
        return response.json() as Promise<{ data: AuditEntry[] }>;
      })
      .then((result) => setEntries(result.data))
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los registros.'));
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex justify-between">
        <a className="font-display text-xl font-bold tracking-[0.18em]" href="/admin">LUCÍA</a>
        <a className="text-xs uppercase tracking-[0.18em] underline" href="/shop">Tienda</a>
      </div>
      <a className="mt-10 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-black/55 transition hover:text-black" href="/admin"><span aria-hidden="true">←</span>Volver al panel</a>
      <h1 className="mt-5 font-display text-6xl font-bold uppercase">Auditoría</h1>
      {message && <p className="mt-6 text-sm text-black/65">{message}</p>}
      {error && <p className="mt-6 text-sm text-red-700" role="alert">{error}</p>}

      <div className="mt-10 overflow-x-auto border border-black/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-xs uppercase tracking-[0.12em]">
              <th className="p-4">Fecha</th><th className="p-4">Admin</th><th className="p-4">Acción</th><th className="p-4">Objeto</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr className="border-b border-black/5" key={entry.id}>
                <td className="p-4 whitespace-nowrap">{new Date(entry.createdAt).toLocaleString('es-AR')}</td>
                <td className="p-4">{entry.actor?.email ?? '—'}</td>
                <td className="p-4 font-semibold">{entry.action}</td>
                <td className="p-4">{entry.entityType} {entry.entityId.slice(0, 8)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}