import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Teaser, parsePosition, teaserMetadata } from '../teaser';

/** "/c/confess/4372" — share landing: the teaser for one specific link. */
export const revalidate = 5;
// Generated on first request, cached 5 s (the build has no database).
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string; position: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, position } = await params;
  const pos = parsePosition(position);
  return pos ? teaserMetadata(slug, pos) : { title: 'Not found' };
}

export default async function ShareLandingPage({ params }: Props) {
  const { slug, position } = await params;
  const pos = parsePosition(position);
  if (!pos) notFound();
  return <Teaser slug={slug} position={pos} />;
}
