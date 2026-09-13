import { NextResponse, type NextRequest } from 'next/server';
import { getRevealView } from '@/lib/chain/queries';
import { isToken } from '@/lib/crypto';

/**
 * What ₹5 bought: the revealed link(s) with signed media URLs, plus this
 * payer's own slot and how long is left to write. Bearer token — never cache.
 */
export async function GET(_req: NextRequest, ctx: RouteContext<'/api/links/[token]/reveal'>) {
  const { token } = await ctx.params;
  if (!isToken(token)) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const data = await getRevealView(token);
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
}
