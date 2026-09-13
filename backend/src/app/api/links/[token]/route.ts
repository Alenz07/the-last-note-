import { NextResponse, type NextRequest } from 'next/server';
import { getMyLink } from '@/lib/chain/queries';
import { isToken } from '@/lib/crypto';

/**
 * Your own link: number, status, what you wrote, read receipts, share text.
 * The reveal token is the bearer credential — never cache this.
 */
export async function GET(_req: NextRequest, ctx: RouteContext<'/api/links/[token]'>) {
  const { token } = await ctx.params;
  if (!isToken(token)) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const data = await getMyLink(token);
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
}
