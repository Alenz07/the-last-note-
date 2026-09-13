import { NextResponse, type NextRequest } from 'next/server';
import { getTeaser } from '@/lib/chain/queries';

/**
 * Read API for the separated frontend: everything a teaser/landing card may
 * show about a chain's latest (or a specific shared) link — the shape, never
 * the content. ?position=N for share landings.
 */
export async function GET(req: NextRequest, ctx: RouteContext<'/api/chains/[slug]/teaser'>) {
  const { slug } = await ctx.params;
  const raw = req.nextUrl.searchParams.get('position');
  const position = raw && /^[1-9]\d{0,8}$/.test(raw) ? Number(raw) : undefined;
  const data = await getTeaser(slug, position);
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, max-age=5, s-maxage=5, stale-while-revalidate=30' },
  });
}
