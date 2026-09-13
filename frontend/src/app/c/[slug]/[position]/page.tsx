import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Teaser, teaserMetadata } from '@/components/Teaser';

/** Share landing: "#4,372 sent you here" — same teaser, aimed at one note. */
export const revalidate = 5;
export function generateStaticParams() {
  return [];
}

const parsePosition = (raw: string): number | null => (/^[1-9]\d{0,8}$/.test(raw) ? Number(raw) : null);

export async function generateMetadata({ params }: PageProps<'/c/[slug]/[position]'>): Promise<Metadata> {
  const { slug, position } = await params;
  const n = parsePosition(position);
  if (!n) return { title: 'Not found' };
  return teaserMetadata(slug, n);
}

export default async function SharedNotePage({ params }: PageProps<'/c/[slug]/[position]'>) {
  const { slug, position } = await params;
  const n = parsePosition(position);
  if (!n) notFound();
  return <Teaser slug={slug} position={n} />;
}
