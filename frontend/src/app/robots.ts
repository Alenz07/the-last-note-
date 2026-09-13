import type { MetadataRoute } from 'next';

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001').replace(/\/$/, '');

/**
 * Public: the landing, the chain list, teasers and the unsealed archive —
 * that archive is the only page with indexable body text, so it matters most.
 * Private: anything behind a secret token, the device's own pages, and admin.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/l/', '/me', '/find', '/pay/', '/admin', '/api/', '/c/*/reveal'],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
