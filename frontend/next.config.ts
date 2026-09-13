import type { NextConfig } from 'next';

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000';

/**
 * The frontend is a pure consumer of the backend (../backend, port 3000).
 * Rewrites keep everything same-origin in dev exactly as Caddy does in prod:
 * pages render here; /api, /admin and the legal pages proxy to the backend.
 */
const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  // Rendered server-side for /manual; keep it out of the bundler's hands.
  serverExternalPackages: ['@react-pdf/renderer'],
  // Let phones on the same Wi-Fi open the dev server (Next 16 blocks cross-origin dev assets otherwise).
  // Dev-only: Next refuses to serve dev assets to origins not listed here, which
  // leaves the page rendered but unhydrated (buttons become inert markup).
  // The ngrok hosts matter for testing anything needing HTTPS — mic, payments.
  allowedDevOrigins: [
    '192.168.1.7',
    '192.168.*.*',
    '10.*.*.*',
    '172.16.*.*',
    '*.ngrok-free.dev',
    '*.ngrok-free.app',
    '*.ngrok.io',
    '*.ngrok.app',
  ],
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${BACKEND}/api/:path*` },
      { source: '/admin/:path*', destination: `${BACKEND}/admin/:path*` },
      { source: '/admin', destination: `${BACKEND}/admin` },
      { source: '/terms', destination: `${BACKEND}/terms` },
      { source: '/privacy', destination: `${BACKEND}/privacy` },
      { source: '/refunds', destination: `${BACKEND}/refunds` },
      { source: '/content-policy', destination: `${BACKEND}/content-policy` },
      { source: '/grievance', destination: `${BACKEND}/grievance` },
    ];
  },
};

export default nextConfig;
