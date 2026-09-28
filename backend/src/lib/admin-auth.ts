import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { env, LIMITS } from './env';
import { safeEqual, sign, verify } from './crypto';

const TTL = 60 * 60 * 24 * 7;

export function checkAdminPassword(pw: string): boolean {
  return safeEqual(pw, env.adminPassword);
}

export function adminCookieValue(): string {
  return sign('admin', TTL);
}

export function adminCookieOptions() {
  return { httpOnly: true, sameSite: 'lax' as const, secure: env.cookieSecure, path: '/', maxAge: TTL };
}

export async function isAdmin(): Promise<boolean> {
  const c = (await cookies()).get(LIMITS.adminCookie)?.value;
  return verify(c) === 'admin';
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect('/admin/login');
}
