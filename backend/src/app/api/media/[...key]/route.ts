import { NextResponse, type NextRequest } from 'next/server';
import { getStorage, type LocalStorage } from '@/lib/storage';

/** Serves private media for the local storage driver. Signed + expiring; S3/R2 sign their own URLs. */
export async function GET(req: NextRequest, ctx: RouteContext<'/api/media/[...key]'>) {
  const storage = getStorage();
  // `kind` check rather than instanceof: the singleton survives HMR, class identities don't
  if (storage.kind !== 'local') return new NextResponse(null, { status: 404 });
  const local = storage as LocalStorage;
  const { key } = await ctx.params;
  const k = key.join('/');
  const url = req.nextUrl;
  const hit = await local.readSigned(k, url.searchParams.get('e'), url.searchParams.get('s'));
  if (!hit) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(hit.body), {
    headers: {
      'Content-Type': hit.contentType,
      'Content-Length': String(hit.body.byteLength),
      'Cache-Control': 'private, max-age=600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
