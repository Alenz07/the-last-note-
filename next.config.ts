import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Single Docker image deploy (node .next/standalone/server.js)
  output: 'standalone',
  // Node-native packages stay outside the server bundle
  serverExternalPackages: ['@electric-sql/pglite', 'postgres', 'ioredis', 'web-push'],
  poweredByHeader: false,
  // Let phones on the same Wi-Fi load the dev server (Next blocks cross-origin dev assets by default)
  allowedDevOrigins: ['192.168.*.*', '10.*.*.*', '172.16.*.*', '*.local'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), microphone=(self)' },
        ],
      },
      {
        // service worker must be allowed to control the whole origin
        source: '/sw.js',
        headers: [
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Cache-Control', value: 'no-cache' },
        ],
      },
    ];
  },
};

export default nextConfig;
