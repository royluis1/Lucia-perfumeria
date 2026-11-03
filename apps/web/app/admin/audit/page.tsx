'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../lib/auth';
import { Logo } from '../../../components/logo';

type AuditEntry = {
  id: string;
  actor: { email: string } | null;
  action: string;
  entity: string;
  entityId: string;
  metadata: unknown;
  createdAt: string;
};

export default function AdminAuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/admin/audit?limit=50')
      .then(async (response) => {
        if (!response.ok) throw new Error('No tenés permisos para ver este módulo.');
        return response.json() as Promise<{ data: AuditEntry[] }>;
      })
      .then((result) => setEntries(result.data))
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los registros.'));
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 md:py-16">
      <div className="flex items-center justify-between">
        <a className="font-display text-xl" href="/admin" aria-label="Panel admin"><Logo className="text-xl" /></a>
        <a className="ul text-xs font-semibold uppercase tracking-[0.22em]" href="/shop">Tienda</a>
      </div>
      <a className="mt-10 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.22em] text-muted transition-colors hover:text-black" href="/admin"><span aria-hidden="true">←</span>Volver al panel</a>
      <h1 className="mt-5 font-display text-[clamp(2rem,8vw,3.75rem)] font-black uppercase tracking-[-0.02em] md:text-6xl">Auditoría</h1>
      {message && <p className="mt-6 border border-line bg-white px-4 py-3 text-sm">{message}</p>}
      {error && <p className="mt-6 border border-red-700/30 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}

      <div className="mt-10 overflow-x-auto overscroll-x-contain border border-line bg-white">
        <table className="min-w-[760px] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              {['Fecha', 'Admin', 'Acción', 'Objeto'].map((heading) => (
                <th className="p-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted" key={heading}>{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr className="border-b border-line transition-colors last:border-b-0 hover:bg-black/[0.03]" key={entry.id}>
                <td className="whitespace-nowrap p-4">{new Date(entry.createdAt).toLocaleString('es-AR')}</td>
                <td className="p-4">{entry.actor?.email ?? '—'}</td>
                <td className="p-4 font-semibold">{entry.action}</td>
                <td className="p-4">{entry.entity} {entry.entityId.slice(0, 8)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}