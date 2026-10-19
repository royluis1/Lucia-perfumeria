'use client';

import { useEffect, useState } from 'react';
import { listPendingReviews, approveReview, deleteReview } from '../../../lib/admin';
import type { PendingReview } from '../../../lib/admin';
import { Logo } from '../../../components/logo';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      setReviews(await listPendingReviews());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar las reseñas.');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleApprove(id: string) {
    try {
      await approveReview(id);
      await load();
      setMessage('Reseña aprobada y publicada.');
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : 'No se pudo aprobar la reseña');
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('¿Eliminar esta reseña definitivamente?')) return;
    try {
      await deleteReview(id);
      await load();
      setMessage('Reseña eliminada.');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar la reseña');
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex items-center justify-between">
        <a className="font-display text-xl" href="/admin" aria-label="Panel admin"><Logo className="text-xl" /></a>
        <a className="ul text-xs font-semibold uppercase tracking-[0.22em]" href="/shop">Tienda</a>
      </div>
      <a className="mt-10 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.22em] text-muted transition-colors hover:text-black" href="/admin"><span aria-hidden="true">←</span>Volver al panel</a>
      <h1 className="mt-5 font-display text-6xl font-black uppercase tracking-[-0.02em]">Reseñas pendientes</h1>
      {message && <p className="mt-6 border border-line bg-white px-4 py-3 text-sm" role="status">{message}</p>}
      {error && <p className="mt-6 border border-red-700/30 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}

      <div className="mt-10 space-y-4">
        {reviews.length === 0 && <p className="border border-line bg-white p-8 text-muted">No hay reseñas pendientes de moderación.</p>}
        {reviews.map((review) => (
          <article className="border border-line bg-white p-6" key={review.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">{review.user.name ?? 'Cliente'}</p>
                <p className="mt-1 text-xs text-muted">
                  {review.product.name} · {new Date(review.createdAt).toLocaleDateString('es-AR')}{' '}
                  <span className={review.isVerifiedPurchase ? 'badge-flat border-black bg-black text-white' : 'badge-flat text-muted'}>
                    {review.isVerifiedPurchase ? 'Compra verificada' : 'Sin verificar'}
                  </span>
                </p>
                <p className="mt-2 text-sm tracking-[0.2em] text-ink" aria-label={`${review.rating} de 5 estrellas`}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
                <p className="mt-2 text-sm leading-6 text-black/70">{review.comment}</p>
              </div>
              <div className="flex gap-2">
                <button className="border border-black bg-black px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white hover:text-black" onClick={() => void handleApprove(review.id)} type="button">Aprobar</button>
                <button className="border border-red-700/30 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-red-700 transition-colors hover:bg-red-50" onClick={() => void handleDelete(review.id)} type="button">Eliminar</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}