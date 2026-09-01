import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';
import { OG_SIZE, SealedCard, ogFonts } from '@/components/og/SealedCard';
import { loadTeaser } from './teaser';

export const revalidate = 60;
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await loadTeaser(slug);
  if (!data) notFound();
  return new ImageResponse(<SealedCard chain={data.chain} sealed={data.sealed} />, {
    ...size,
    fonts: await ogFonts(),
  });
}
