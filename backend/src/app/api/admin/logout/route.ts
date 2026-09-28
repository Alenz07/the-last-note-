import { NextResponse, type NextRequest } from 'next/server';
import { LIMITS, env } from '@/lib/env';

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/admin/login', env.siteUrl), 303);
  res.cookies.set(LIMITS.adminCookie, '', { path: '/', maxAge: 0 });
  return res;
}
