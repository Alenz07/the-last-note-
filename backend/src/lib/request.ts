import { NextResponse } from 'next/server';
import { env, LIMITS } from './env';
import { isUuid, newId } from './crypto';

/**
 * Request-side helpers: anonymous device identity, city, IP. No accounts.
 */

export function readDeviceId(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  const m = cookieHeader.match(new RegExp(`(?:^|;\\s*)${LIMITS.deviceCookie}=([^;]+)`));
  const v = m?.[1];
  return isUuid(v) ? v : null;
}

/** Returns the device id from the request cookie, or mints a new one (caller must set the cookie). */
export function deviceFromRequest(req: Request): { id: string; isNew: boolean } {
  const existing = readDeviceId(req.headers.get('cookie'));
  if (existing) return { id: existing, isNew: false };
  return { id: newId(), isNew: true };
}

export function setDeviceCookie(res: NextResponse, id: string): void {
  res.cookies.set(LIMITS.deviceCookie, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.cookieSecure,
    path: '/',
    maxAge: LIMITS.deviceCookieMaxAge,
  });
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/** City from the edge (Cloudflare / Vercel). Never trust it for anything but display. */
export function cityFromHeaders(h: Headers): string | null {
  const raw = h.get('cf-ipcity') || h.get('x-vercel-ip-city') || (!env.isProd ? h.get('x-kadi-city') : null);
  if (!raw) return null;
  let v = raw;
  try {
    v = decodeURIComponent(raw);
  } catch {
    /* keep raw */
  }
  v = v.replace(/[^\p{L}\p{M}\s'.-]/gu, '').trim().slice(0, 40);
  return v ? titleCase(v) : null;
}

export function ipFromHeaders(h: Headers): string {
  return (
    h.get('cf-connecting-ip') ||
    h.get('x-real-ip') ||
    h.get('x-forwarded-for')?.split(',')[0].trim() ||
    '0.0.0.0'
  );
}

export function json<T>(data: T, init?: ResponseInit): NextResponse<T> {
  return NextResponse.json(data, init);
}

export function error(status: number, error: string, extra: Record<string, unknown> = {}): NextResponse {
  return NextResponse.json({ ok: false, error, ...extra }, { status });
}
