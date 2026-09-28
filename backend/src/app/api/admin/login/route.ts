import { NextResponse, type NextRequest } from 'next/server';
import { adminCookieOptions, adminCookieValue, checkAdminPassword } from '@/lib/admin-auth';
import { LIMITS, env } from '@/lib/env';
import { rateLimit } from '@/lib/kv';
import { getServices } from '@/lib/services';
import { ipFromHeaders } from '@/lib/request';

export async function POST(req: NextRequest) {
  const s = await getServices();
  const rl = await rateLimit(s.kv, 'admin-login', ipFromHeaders(req.headers), 10, 600);
  if (!rl.ok) return NextResponse.redirect(new URL('/admin/login?error=slow', env.siteUrl), 303);
  const fd = await req.formData();
  const pw = String(fd.get('password') ?? '');
  if (!checkAdminPassword(pw)) return NextResponse.redirect(new URL('/admin/login?error=1', env.siteUrl), 303);
  const res = NextResponse.redirect(new URL('/admin', env.siteUrl), 303);
  res.cookies.set(LIMITS.adminCookie, adminCookieValue(), adminCookieOptions());
  return res;
}
