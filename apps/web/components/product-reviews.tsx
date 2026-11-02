'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, AUTH_CHANGE_EVENT, getAccessToken } from '../lib/auth';
import type { ProductReviews } from '../lib/api';

type ProductReviewsProps = {
  productId: string;
  productSlug: string;
  initialReviews: ProductReviews | null;
  loadFailed: boolean;
};

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value));
}

export function ProductReviewsSection({
  productId,
  productSlug,
  initialReviews,
  loadFailed,
}: ProductReviewsProps) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const reviews = initialReviews?.data ?? [];

  useEffect(() => {
    const syncLogin = () => setLoggedIn(Boolean(getAccessToken()));
    syncLogin();
    window.addEventListener(AUTH_CHANGE_EVENT, syncLogin);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, syncLogin);
  }, []);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const response = await apiFetch('/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating, comment }),
      });
      if (response.status === 403) {
        throw new Error('Solo podés dejar una reseña si compraste este producto desde esta cuenta.');
      }
      if (response.status === 409) {
        throw new Error('Ya enviaste una reseña para este producto.');
      }
      if (!response.ok) {
        throw new Error('No pudimos enviar tu reseña. Intentá nuevamente.');
      }
      setComment('');
      setRating(5);
      setMessage('Gracias. Tu reseña quedó pendiente de aprobación.');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No pudimos enviar tu reseña. Intentá nuevamente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="product-reviews-title" className="mx-auto max-w-7xl px-6 pb-20">
      <h2 className="font-display text-4xl font-black uppercase tracking-[-0.02em]" id="product-reviews-title">
        Reseñas
      </h2>

      {loadFailed && (
        <p className="mt-4 text-sm text-red-700" role="status">
          No pudimos cargar las reseñas en este momento.
        </p>
      )}

      {reviews.length > 0 && initialReviews && (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-3" aria-label={`Promedio de ${initialReviews.averageRating} de 5 estrellas`}>
            <span aria-hidden="true" className="text-xl tracking-wide text-amber-700">
              {'★'.repeat(Math.round(initialReviews.averageRating))}{'☆'.repeat(5 - Math.round(initialReviews.averageRating))}
            </span>
            <span className="font-semibold">{initialReviews.averageRating.toLocaleString('es-AR')} / 5</span>
            <span className="text-sm text-muted">({initialReviews.total} reseñas aprobadas)</span>
          </div>

          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {reviews.map((review) => (
              <li className="border border-line bg-white p-5" key={review.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{review.user.name}</p>
                  <time className="text-xs text-muted" dateTime={review.createdAt}>{formatReviewDate(review.createdAt)}</time>
                </div>
                <p aria-label={`${review.rating} de 5 estrellas`} className="mt-2 text-amber-700">
                  <span aria-hidden="true">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted">{review.comment}</p>
                {review.isVerifiedPurchase && (
                  <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Compra verificada</p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-10 max-w-2xl">
        {loggedIn ? (
          <form className="space-y-4" onSubmit={(event) => void submitReview(event)}>
            <h3 className="text-lg font-semibold">Dejá tu opinión</h3>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Tu calificación</legend>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <label className="cursor-pointer" key={value}>
                    <input
                      checked={rating === value}
                      className="peer sr-only"
                      name="rating"
                      onChange={() => setRating(value)}
                      type="radio"
                      value={value}
                    />
                    <span
                      aria-label={`${value} ${value === 1 ? 'estrella' : 'estrellas'}`}
                      className={`flex h-11 w-11 items-center justify-center border text-lg transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white ${
                        rating === value ? 'border-ink bg-ink text-white' : 'border-line text-muted'
                      }`}
                    >
                      {value}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block text-sm font-medium" htmlFor="review-comment">Tu reseña</label>
            <textarea
              className="input-line min-h-32 w-full resize-y border border-line p-3 text-sm normal-case tracking-normal"
              id="review-comment"
              maxLength={2000}
              onChange={(event) => setComment(event.target.value)}
              required
              value={comment}
            />
            {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
            {message && <p className="text-sm text-green-800" role="status">{message}</p>}
            <button className="btn-primary min-h-11 disabled:opacity-60" disabled={submitting} type="submit">
              {submitting ? 'Enviando...' : 'Enviar reseña'}
            </button>
          </form>
        ) : (
          <p className="text-sm text-muted">
            <Link
              className="ul font-semibold text-ink"
              href={`/login?redirect=${encodeURIComponent(`/shop/${productSlug}`)}`}
            >
              Iniciá sesión
            </Link>
            {' '}para dejar una reseña.
          </p>
        )}
      </div>
    </section>
  );
}
