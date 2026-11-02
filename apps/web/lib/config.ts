const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;

if (
  process.env.NODE_ENV === 'production' &&
  (!configuredApiUrl || configuredApiUrl.trim() === '')
) {
  throw new Error(
    'Falta NEXT_PUBLIC_API_URL en el entorno de producción. Definila en Vercel como /api/backend y redeployá.'
  );
}

const publicApiUrl = (configuredApiUrl ?? 'http://localhost:3005').replace(/\/+$/, '');

export const API_URL =
  typeof window === 'undefined' && publicApiUrl.startsWith('/')
    ? process.env.API_PROXY_TARGET?.replace(/\/+$/, '') ?? publicApiUrl
    : publicApiUrl;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_WEB_APP_URL ??
  'https://lucia-perfumeria-royluis1.vercel.app';