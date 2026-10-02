import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/settings';

/**
 * The operator knobs the public site needs to render: whether it is free
 * right now, what the banner says, and how long the reveal sheet holds.
 *
 * Short cache on purpose. Flipping free mode in the admin should reach a
 * visitor in seconds, which is the point of it living in a row rather than
 * in the environment.
 */
export async function GET() {
  const { freeMode, freeBanner, revealHoldSeconds } = await getSettings();
  return NextResponse.json(
    { freeMode, freeBanner, revealHoldSeconds },
    { headers: { 'Cache-Control': 'public, max-age=5, s-maxage=5, stale-while-revalidate=30' } },
  );
}
