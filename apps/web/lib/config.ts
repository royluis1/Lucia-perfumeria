const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;

if (
  process.env.NODE_ENV === 'production' &&
  (!configuredApiUrl || configuredApiUrl.trim() === '')
) {
  throw new Error(
    'Falta NEXT_PUBLIC_API_URL en el entorno de producción. Definila en Vercel (https://lucia-perfumeria-609t.onrender.com) y redeployá.'
  );
}

export const API_URL = (configuredApiUrl ?? 'http://localhost:3005').replace(/\/+$/, '');

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_WEB_APP_URL ??
  'https://lucia-perfumeria-royluis1.vercel.app';