import { NextResponse, type NextRequest } from 'next/server';
import { LIMITS } from '@/lib/env';

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/admin/login', req.url), 303);
  res.cookies.set(LIMITS.adminCookie, '', { path: '/', maxAge: 0 });
  return res;
}
