import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { env } from './env';

/** URL-safe random token. 32 bytes = 256 bits; used for reveal tokens. */
export const randomToken = (bytes = 32): string => randomBytes(bytes).toString('base64url');

export const newId = (): string => randomUUID();

export const hmac = (data: string, secret: string = env.appSecret): string =>
  createHmac('sha256', secret).update(data).digest('base64url');

export const hmacHex = (data: string, secret: string): string =>
  createHmac('sha256', secret).update(data).digest('hex');

export const sha256 = (data: string): string => createHash('sha256').update(data).digest('hex');

export function safeEqual(a: string, b: string): boolean {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  return A.length === B.length && timingSafeEqual(A, B);
}

/** `exp.payload.sig` — a tiny signed, expiring token (cookies, media URLs). */
export function sign(payload: string, ttlSeconds: number, now: Date = new Date()): string {
  const exp = Math.floor(now.getTime() / 1000) + ttlSeconds;
  const body = `${exp}.${payload}`;
  return `${body}.${hmac(body)}`;
}

export function verify(token: string | null | undefined, now: Date = new Date()): string | null {
  if (!token) return null;
  const i = token.lastIndexOf('.');
  if (i <= 0) return null;
  const body = token.slice(0, i);
  const sig = token.slice(i + 1);
  if (!safeEqual(sig, hmac(body))) return null;
  const j = body.indexOf('.');
  const exp = Number(body.slice(0, j));
  if (!Number.isFinite(exp) || exp * 1000 < now.getTime()) return null;
  return body.slice(j + 1);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID_RE.test(v);

const TOKEN_RE = /^[A-Za-z0-9_-]{20,128}$/;
export const isToken = (v: unknown): v is string => typeof v === 'string' && TOKEN_RE.test(v);
