import type { MetadataRoute } from 'next';
import { getChains } from '@/lib/api';

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001').replace(/\/$/, '');

/** Rebuilt hourly — chains grow, and the unsealed archive grows with them. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const fixed: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: 'hourly', priority: 1 },
    { url: `${SITE}/chains`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE}/refunds`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE}/content-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE}/grievance`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];

  // A dead backend must not break the sitemap — getChains() already returns [].
  const chains = await getChains();
  const perChain = chains.flatMap((c) => [
    { url: `${SITE}/c/${c.slug}`, lastModified: now, changeFrequency: 'hourly' as const, priority: 0.8 },
    // The archive carries the actual indexable prose.
    { url: `${SITE}/c/${c.slug}/unsealed`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.7 },
  ]);

  return [...fixed, ...perChain];
}
