import type { Metadata } from 'next';
import { UnsealedList, unsealedMetadata } from './unsealed-list';

export const revalidate = 60;
// Generated on first request, cached 60 s (the build has no database).
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return unsealedMetadata(slug, 1);
}

export default async function UnsealedPage({ params }: Props) {
  const { slug } = await params;
  return <UnsealedList slug={slug} page={1} />;
}
