import { NextResponse, type NextRequest } from 'next/server';
import { getMyLinks } from '@/lib/chain/queries';
import { readDeviceId } from '@/lib/request';

/** Every link left from this device (anonymous cookie — no accounts). */
export async function GET(req: NextRequest) {
  const deviceId = readDeviceId(req.headers.get('cookie'));
  if (!deviceId) return NextResponse.json({ links: [] }, { headers: { 'Cache-Control': 'private, no-store' } });
  const links = await getMyLinks(deviceId);
  return NextResponse.json({ links }, { headers: { 'Cache-Control': 'private, no-store' } });
}
