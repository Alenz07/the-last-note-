import { NextResponse, type NextRequest } from 'next/server';
import { sweep } from '@/lib/chain/core';
import { safeEqual } from '@/lib/crypto';
import { env } from '@/lib/env';
import { getServices } from '@/lib/services';

/** External scheduler entry point (the server also runs this itself every 5 min). */
async function run(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const q = req.nextUrl.searchParams.get('secret') ?? '';
  if (!safeEqual(bearer || q, env.cronSecret)) return NextResponse.json({ ok: false }, { status: 401 });
  const r = await sweep(await getServices());
  return NextResponse.json({ ok: true, ...r });
}

export const GET = run;
export const POST = run;
