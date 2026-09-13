import { NextResponse } from 'next/server';
import { getLiveChains } from '@/lib/chain/queries';

/**
 * Read API for the separated frontend: all live chains with stats.
 * Cheap (KV-cached stats) + CDN-cacheable.
 */
export async function GET() {
  const chains = await getLiveChains();
  return NextResponse.json(
    { chains },
    { headers: { 'Cache-Control': 'public, max-age=5, s-maxage=5, stale-while-revalidate=30' } },
  );
}
