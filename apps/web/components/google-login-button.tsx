'use client';

import { googleAuthUrl } from '../lib/auth';

export function GoogleLoginButton({ label = 'Continuar con Google' }: { label?: string }) {
  return (
    <a
      className="flex w-full items-center justify-center gap-3 border border-black/20 bg-white px-8 py-4 text-sm font-semibold text-black transition hover:border-black hover:bg-black/[0.03]"
      href={googleAuthUrl()}
    >
      <GoogleIcon />
      {label}
    </a>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
      <path
        d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"
        fill="#FFC107"
      />
      <path
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
        fill="#FF3D00"
      />
      <path
        d="M24 44c5.5 0 10.3-2 14.1-5.2l-6.5-5.5C30.1 34.5 27.2 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.6 5C9.7 39.7 16.3 44 24 44z"
        fill="#4CAF50"
      />
      <path
        d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.5 5.5C37.9 39.9 48 36.5 48 24c0-1.3-.1-2.6-.4-3.9z"
        fill="#1976D2"
      />
    </svg>
  );
}