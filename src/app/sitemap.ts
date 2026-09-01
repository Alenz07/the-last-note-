import type { MetadataRoute } from 'next';
import { getLiveChains } from '@/lib/chain/queries';
import { env } from '@/lib/env';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const chains = await getLiveChains();
  const now = new Date();
  return [
    { url: env.appUrl, lastModified: now, changeFrequency: 'hourly', priority: 1 },
    ...chains.flatMap((c) => [
      { url: `${env.appUrl}/c/${c.slug}`, lastModified: now, changeFrequency: 'always' as const, priority: 0.9 },
      { url: `${env.appUrl}/c/${c.slug}/unsealed`, lastModified: now, changeFrequency: 'hourly' as const, priority: 0.6 },
    ]),
  ];
}
