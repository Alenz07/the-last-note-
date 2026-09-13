import type { Metadata } from 'next';
import { Teaser, teaserMetadata } from '@/components/Teaser';

// Hot read path: ISR-cached, no per-view backend hit.
export const revalidate = 5;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<'/c/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  return teaserMetadata(slug);
}

export default async function ChainPage({ params }: PageProps<'/c/[slug]'>) {
  const { slug } = await params;
  return <Teaser slug={slug} />;
}
