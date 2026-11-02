import path from 'path';
import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const apiProxyTarget = process.env.API_PROXY_TARGET?.replace(/\/+$/, '');

if (process.env.NODE_ENV === 'production' && !apiProxyTarget) {
  throw new Error('Falta API_PROXY_TARGET para enrutar la API por el dominio de la web.');
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    return apiProxyTarget
      ? [{ source: '/api/backend/:path*', destination: `${apiProxyTarget}/:path*` }]
      : [];
  },
};

export default nextConfig;