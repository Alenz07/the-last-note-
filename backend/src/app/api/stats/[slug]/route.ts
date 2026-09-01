import { NextResponse, type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { chains } from '@/db/schema';
import { getStatsCached } from '@/lib/chain/queries';
import { getServices } from '@/lib/services';

/** Live counters. KV-cached 3 s server-side; CDN may cache 3 s too. */
export async function GET(_req: NextRequest, ctx: RouteContext<'/api/stats/[slug]'>) {
  const { slug } = await ctx.params;
  const s = await getServices();
  const [c] = await s.db.select().from(chains).where(eq(chains.slug, slug)).limit(1);
  if (!c) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const stats = await getStatsCached(s.db, s.kv, c);
  return NextResponse.json(stats, { headers: { 'Cache-Control': 'public, max-age=3, s-maxage=3, stale-while-revalidate=10' } });
}
