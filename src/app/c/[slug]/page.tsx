import type { Metadata } from 'next';
import { Teaser, teaserMetadata } from './teaser';

export const revalidate = 5;
// No params at build time (the build has no database); every slug is generated on first request and cached 5 s.
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return teaserMetadata(slug);
}

export default async function ChainTeaserPage({ params }: Props) {
  const { slug } = await params;
  return <Teaser slug={slug} />;
}
