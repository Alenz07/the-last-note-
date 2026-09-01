import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

/** Teasers and unsealed feeds are the public face; tokens and personal pages never index. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/l/', '/me', '/find', '/admin', '/api/', '/c/*/reveal'] }],
    sitemap: `${env.appUrl}/sitemap.xml`,
  };
}
