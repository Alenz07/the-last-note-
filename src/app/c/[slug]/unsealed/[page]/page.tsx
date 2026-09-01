import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { UnsealedList, unsealedMetadata } from '../unsealed-list';

export const revalidate = 60;
// Generated on first request, cached 60 s (the build has no database).
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string; page: string }> };

const parsePage = (raw: string) => (/^[2-9]\d{0,4}$|^1\d{1,4}$/.test(raw) ? Number(raw) : null);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, page } = await params;
  const n = parsePage(page);
  return n ? unsealedMetadata(slug, n) : { title: 'Not found' };
}

export default async function UnsealedOlderPage({ params }: Props) {
  const { slug, page } = await params;
  const n = parsePage(page);
  if (!n) notFound();
  return <UnsealedList slug={slug} page={n} />;
}
