import { NextResponse, type NextRequest } from 'next/server';
import { getUnsealedLinks } from '@/lib/chain/queries';

/**
 * The public archive: text of links the chain has moved `unsealAfter` past.
 * Media is never unsealed. Cacheable — it only changes as the chain grows.
 */
export async function GET(req: NextRequest, ctx: RouteContext<'/api/chains/[slug]/unsealed'>) {
  const { slug } = await ctx.params;
  const raw = req.nextUrl.searchParams.get('page');
  const page = raw && /^[1-9]\d{0,5}$/.test(raw) ? Number(raw) : 1;
  const data = await getUnsealedLinks(slug, page, 50);
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300' },
  });
}
